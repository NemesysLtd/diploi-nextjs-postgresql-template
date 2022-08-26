#!/bin/sh

# Perform tasks at controller pod startup
echo "Runonce started";

# Insert accepted ssh key(s)
cat /etc/ssh/internal_ssh_host_rsa.pub >> /root/.ssh/authorized_keys;

cd /app;

# Seems that this is first run in devel instance
# Intialize persistant storage
if [ ! "$(ls -A /app)" ]; then

  echo "Empty /app, assuming development instance setup was intended"
  #tar zxf /var/lib/diploi-app.tar.gz  -C /
  mkdir -p /root-persist/.vscode-server;
  touch /root-persist/.bash_history;
  touch /root-persist/.gitconfig;

  git init;
  git remote add --fetch origin $REPOSITORY_URL;
  git checkout -f $REPOSITORY_BRANCH;
  git remote set-url origin "$REPOSITORY_URL";
  git config --global user.email "$GIT_USER_EMAIL";
  git config --global user.name "$GIT_USER_NAME";

  npm install;

fi

# Update internal ca certificate
update-ca-certificates

# Make all special env variables available in ssh also (ssh will wipe out env by default)
env >> /etc/environment

# Configure the SQLTools VSCode extension
sed -i 's/POSTGRES_HOST/'"$POSTGRES_HOST"'/' .vscode/settings.json
sed -i 's/POSTGRES_PORT/'"$POSTGRES_PORT"'/' .vscode/settings.json
sed -i 's/POSTGRES_DB/'"$POSTGRES_DB"'/' .vscode/settings.json
sed -i 's/POSTGRES_USER/'"$POSTGRES_USER"'/' .vscode/settings.json
sed -i 's/POSTGRES_PASSWORD/'"$POSTGRES_PASSWORD"'/' .vscode/settings.json

# Now that everything is initialized, start all services
supervisorctl start www

echo "Runonce done";

exit 0;
