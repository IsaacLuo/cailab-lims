// parameters which are not secrect
const config:{
  serverURL?: string,
  googleAuthURL?: string,
} = {};

if (process.env.NODE_ENV === 'production') {
  config.serverURL = 'https://api.lims.dev.cailab.org';
  config.googleAuthURL = '656734864012-ga7roednhiabgbfe53ttevcguivra19a.apps.googleusercontent.com';
} else {
  config.serverURL = 'http://localhost:8000';
  config.googleAuthURL = '656734864012-ga7roednhiabgbfe53ttevcguivra19a.apps.googleusercontent.com';
}

export const serverURL = config.serverURL;
export const googleAuthURL = config.googleAuthURL;
export default config;
