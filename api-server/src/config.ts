import config from '../config.json'
import { IGLobalConfig } from './types.js';

const base = config.base;
const diff = config[process.env.NODE_ENV];

export default {...base, ...diff} as IGLobalConfig;