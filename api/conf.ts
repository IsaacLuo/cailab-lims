import secret from './secret'

const conf = {
  development: {
    serverAddress: 'http://local.cailab.org:8000',
    authServerAddress: 'https://api.auth.cailab.org',
    domainAddress: 'cailab.org',
    secret,
    enablePushService: true,
  },
  production: {
    serverAddress: 'http://api.lims-dev.cailab.org',
    authServerAddress: 'https://api.auth.cailab.org',
    domainAddress: 'cailab.org',
    secret,
    enablePushService: true,
  }
}

if (process.env.NODE_ENV === undefined) {
  process.env.NODE_ENV = 'development';
}

export default conf[process.env.NODE_ENV];