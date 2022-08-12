import http from 'http';
import { shellExec } from './shellExec.mjs';

const Status = {
  GREEN: 'green',
  YELLOW: 'yellow',
  RED: 'red',
};

const supervisorStatusToStatus = {
  STOPPED: Status.GREY,
  STARTING: Status.YELLOW,
  RUNNING: Status.GREEN,
  BACKOFF: Status.RED,
  STOPPING: Status.YELLOW,
  EXITED: Status.GREY,
  FATAL: Status.RED,
  UNKNOWN: Status.GREY,
};

const processStatusToMessage = (name, status) => {
  if (status === Status.GREEN) return `${name} process is running`;
  if (status === Status.YELLOW) return `${name} process is having issues`;
  if (status === Status.RED) return `${name} process has failed to start`;
  return `${name} process is stopped`;
};

const getSupervisorStatus = async (name, process) => {
  let status = Status.RED;
  let isPending = true;

  const processStatus = (await shellExec(`supervisorctl status ${process}`)).stdout || '';
  if (!processStatus.includes('ERROR')) {
    const supervisorStatus = processStatus.split(' ').filter((item) => !!item.trim())[1];
    status = supervisorStatusToStatus[supervisorStatus] || Status.RED;
    isPending = status === Status.RED;
  }

  return {
    status,
    isPending,
    message: processStatusToMessage(name, status),
  };
};

const getAPIStatus = async () => {
  try {
    const apiResponse = JSON.parse((await shellExec('curl http://app/api')).stdout);
    if (apiResponse && apiResponse.error?.message === 'Not Found') {
      return {
        status: Status.GREEN,
        message: '',
      };
    }

    return {
      status: Status.RED,
      message: 'Node.js API is not responding',
    };
  } catch {
    return {
      status: Status.RED,
      message: 'Failed to query Node.js API status',
    };
  }
};

const getWWWStatus = async () => {
  try {
    const nextjsResponse = (await shellExec('curl http://app')).stdout;
    if (nextjsResponse && nextjsResponse.includes('__NEXT_DATA__')) {
      return {
        status: Status.GREEN,
        message: '',
      };
    }

    return {
      status: Status.RED,
      message: 'Next.js is not responding',
    };
  } catch {
    return {
      status: Status.RED,
      message: 'Failed to query Next.js status',
    };
  }
};

const getPostgresStatus = async () => {
  const commonStatus = {
    identifier: 'postgres',
    name: 'PostgreSQL',
    description: 'PostgreSQL database',
    items: [],
  };

  try {
    const postgresResponse = (await shellExec('pg_isready -h $POSTGRES_HOST -p $POSTGRES_PORT')).stdout;
    if (postgresResponse && postgresResponse.includes('accepting connections')) {
      return {
        ...commonStatus,
        status: Status.GREEN,
        message: '',
      };
    }

    return {
      ...commonStatus,
      status: Status.RED,
      message: 'PostgreSQL is not responding',
    };
  } catch {
    return {
      ...commonStatus,
      status: Status.RED,
      message: 'PostgreSQL is not responding',
    };
  }
};

const getStatus = async () => {
  const apiProcessStatus = await getSupervisorStatus('API', 'api');

  let apiStatus = {
    identifier: 'api',
    name: 'API',
    description: 'Node.js API',
    items: [],
    ...apiProcessStatus,
  };

  if (apiProcessStatus.status === Status.GREEN) {
    apiStatus = { ...apiStatus, ...(await getAPIStatus()) };
  }

  const wwwProcessStatus = await getSupervisorStatus('Next.js', 'www');

  let wwwStatus = {
    identifier: 'www',
    name: 'Next.js',
    description: 'Next.js website',
    items: [],
    ...wwwProcessStatus,
  };

  if (wwwProcessStatus.status === Status.GREEN) {
    wwwStatus = { ...wwwStatus, ...(await getWWWStatus()) };
  }

  const proxyProcessStatus = await getSupervisorStatus('Proxy', 'proxy');

  let proxyStatus = {
    identifier: 'proxy',
    name: 'Proxy',
    description: 'Traefik proxy routing API & Next.js traffic',
    items: [],
    ...proxyProcessStatus,
    message: proxyProcessStatus.status === Status.GREEN ? '' : proxyProcessStatus.message,
  };

  const postgresStatus = await getPostgresStatus();

  const status = {
    diploiStatusVersion: 1,
    items: [wwwStatus, postgresStatus],
  };

  return status;
};

const requestListener = async (req, res) => {
  res.writeHead(200);
  res.end(JSON.stringify(await getStatus()));
};

const server = http.createServer(requestListener);
server.listen(3000, '0.0.0.0');
