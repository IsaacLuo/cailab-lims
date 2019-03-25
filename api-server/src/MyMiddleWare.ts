import {Response, NextFunction} from 'express'
import {Request} from './MyRequest'
import secret from '../secret.json'

const dummyUserId = '5c88cea93c27125df4ff9f4a'

export function beUser(req) {
  if (req.headers['test-token'] === secret.test.token) {
    req.currentUser = {
      id:dummyUserId,
      fullName: 'test man',
      email: 'yishaluo@gmail.com',
      groups: ['users'],
      iat: Math.floor(Date.now()),
      exp: Math.floor(Date.now()) + 3600,
      barcode: dummyUserId,
    }
  }
  return (req.currentUser && req.currentUser.groups.indexOf('users')>=0);
}

export function beScanner(req) {
  if (req.headers['test-token'] === secret.test.token) {
      req.currentUser = {
        id:dummyUserId,
        fullName: 'test man',
        email: 'yishaluo@gmail.com',
        groups: ['scanner'],
        iat: Math.floor(Date.now()),
        exp: Math.floor(Date.now()) + 3600,
        barcode: dummyUserId,
      }
    }
  return (req.currentUser && (req.currentUser.groups.indexOf('scanner')>=0));
}

export function beAdmin(req) {
  if (req.headers['test-token'] === secret.test.token) {
      req.currentUser = {
        id:dummyUserId,
        fullName: 'test man',
        email: 'yishaluo@gmail.com',
        groups: ['scanner'],
        iat: Math.floor(Date.now()),
        exp: Math.floor(Date.now()) + 3600,
        barcode: dummyUserId,
      }
    }
  return (req.currentUser && req.currentUser.groups.indexOf('administrators')>=0);
}

export function beARScanner(req) {
  if (req.headers['token'] === secret.ARScannerToken) {
      req.currentUser = {
        id:dummyUserId,
        fullName: 'AR Scanner',
        email: 'cailab.bio@gmail.com',
        groups: ['scanner'],
        iat: Math.floor(Date.now()),
        exp: Math.floor(Date.now()) + 3600,
        barcode: dummyUserId,
      }
    }
  return req.currentUser;
}

export function or(...args: Array<(req:Request)=>boolean>) {
  const arg = arguments;
  return (req :Request, res :Response, next: NextFunction) => {
    if (Array.prototype.some.call(arg, f=>f(req))) {
      next();
    } else {
      res.status(401).json({message: 'no previlege'})
    }
  }
}

export function userMustBeAdmin (req :Request, res :Response, next: NextFunction) {
    if (req.currentUser && req.currentUser.groups.indexOf('administrators')>=0) {
      req.log.info('currentGoup', req.currentUser.groups)
      next();
    } else if (req.headers['test-token'] === secret.test.token) {
      req.currentUser = {
        id:dummyUserId,
        fullName: 'test man',
        email: 'yishaluo@gmail.com',
        groups: ['users'],
        iat: Math.floor(Date.now()),
        exp: Math.floor(Date.now()) + 3600,
        barcode: dummyUserId,
      }
      next();
    } else {
      if(req.currentUser) {
        req.log.warn(`${req.currentUser.fullName} is trying to access admin functions ${req.url}`);
      } else {
        req.log.warn(`guest is trying to access admin functions ${req.url}`);
      }
      res.status(401).json({message: 'require admin'})
    }
  }
  
  export function userMustLoggedIn (req :Request, res :Response, next: NextFunction) {
    if (req.headers['test-token'] === secret.test.token) {
      req.currentUser = {
        id:dummyUserId,
        fullName: 'test man',
        email: 'yishaluo@gmail.com',
        groups: ['users'],
        iat: Math.floor(Date.now()),
        exp: Math.floor(Date.now()) + 3600,
        barcode:dummyUserId,
      }
    }
    if (req.currentUser && req.currentUser.groups.indexOf('users')>=0) {
      next();
    } else {
      req.log.warn(`guest is trying to access login functions ${req.url}`);
      res.status(401).json({message: 'require log in'})
    }
  }

  export function userCanUseScanner (req :Request, res :Response, next: NextFunction) {
    if (req.headers['test-token'] === secret.test.token) {
      req.currentUser = {
        id:dummyUserId,
        fullName: 'test man',
        email: 'yishaluo@gmail.com',
        groups: ['scanner'],
        iat: Math.floor(Date.now()),
        exp: Math.floor(Date.now()) + 3600,
        barcode: dummyUserId,
      }
    }
    if (req.currentUser && (req.currentUser.groups.indexOf('scanner')>=0 || req.currentUser.groups.indexOf('users')>=0)) {
      // console.log(`${req.currentUser.fullName} is ready for scanning`);
      next();
    } else {
      req.log.warn(`guest is trying to access scanner functions ${req.url}`, req.currentUser);
      res.status(401).json({message: 'require log in'})
    }
  }

  export function fromFluidXScanner (req :Request, res :Response, next: NextFunction) {
    if (req.headers['token'] === secret.rackScannerToken) {
      req.currentUser = {
        id:'Scanner',
        fullName: 'Rack Scanner',
        email: 'cailab.bio@gmail.com',
        groups: ['scanner'],
        iat: Math.floor(Date.now()),
        exp: Math.floor(Date.now()) + 3600,
        barcode: 'scanner',
      }
      next();
    } else {
      req.log.warn(`this function is for scanner only`, req.currentUser);
      res.status(401).json({message: 'require scanner'})
    }
    
  }