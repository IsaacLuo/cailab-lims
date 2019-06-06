import koa from 'koa';
import { ICustomState } from './types';

export function userMust (...args: Array<(ctx:koa.ParameterizedContext<any, {}>, next:()=>Promise<any>)=>boolean>) {
  const arg = arguments;
  return async (ctx:koa.ParameterizedContext<any, {}>, next:()=>Promise<any>)=> {
    if (Array.prototype.some.call(arg, f=>f(ctx))) {
      await next();
    } else {
      ctx.throw(401);
    }
  };
}

export function beUser (ctx:koa.ParameterizedContext<ICustomState, {}>, next:()=>Promise<any>) {
  return ctx.state.user && (ctx.state.user.groups.indexOf('lims/users')>=0 || ctx.state.user.groups.indexOf('users')>=0);
}

export function beAdmin (ctx:koa.ParameterizedContext<ICustomState, {}>, next:()=>Promise<any>) {
  return ctx.state.user && (ctx.state.user.groups.indexOf('administrators')>=0 || ctx.state.user.groups.indexOf('lims/administrators')>=0);
}

export function beScanner (ctx:koa.ParameterizedContext<ICustomState, {}>, next:()=>Promise<any>) {
  return ctx.state.user && (ctx.state.user.groups.indexOf('lims/scanners')>=0);
}

export function beGuest (ctx:koa.ParameterizedContext<ICustomState, {}>, next:()=>Promise<any>) {
  return ctx.state.user === undefined || ctx.state.user._id === '000000000000000000000000';
}
