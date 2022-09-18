FROM nemesys/diploi-nextjs-psql-template:[template-tag]

# Install application code
WORKDIR /app
COPY project/. ./
RUN npm install
RUN npm run build
