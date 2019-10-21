// parameters which are not secrect
const config:{
  serverURL?: string,
  googleAuthURL?: string,
  cailabAuthURL?: string,
} = {};

if (process.env.NODE_ENV === 'production') {
  config.serverURL = 'https://api.lims-dev.cailab.org';
  config.googleAuthURL = '656734864012-ga7roednhiabgbfe53ttevcguivra19a.apps.googleusercontent.com';
} else {
  config.serverURL = 'http://local.cailab.org:8000';
  config.googleAuthURL = '656734864012-ga7roednhiabgbfe53ttevcguivra19a.apps.googleusercontent.com';
}

config.cailabAuthURL = `https://auth.cailab.org`;

if ((process.env as any).REACT_APP_SERVER_URL) {
  config.serverURL = (process.env as any).SERVER_URL;
}

console.log('processenv', process.env);

export const serverURL = config.serverURL;
export const googleAuthURL = config.googleAuthURL;
export const cailabAuthURL = config.cailabAuthURL;
export default config;
