import {Response, NextFunction} from 'express'
import {Request} from './MyRequest'
import secret from '../secret.json'

const dummyUserId = '5c88cea93c27125df4ff9f4a'

export function beUser(req) {
  // if (req.headers['test-token'] === secret.test.token) {
  //   req.currentUser = {
  //     id:dummyUserId,
  //     fullName: 'test man',
  //     email: 'yishaluo@gmail.com',
  //     groups: ['users'],
  //     iat: Math.floor(Date.now()),
  //     exp: Math.floor(Date.now()) + 3600,
  //     barcode: dummyUserId,
  //   }
  // }
  return (req.currentUser && (req.currentUser.groups.indexOf('lims/users')>=0 || req.currentUser.groups.indexOf('users')>=0));
}

export function beScanner(req) {
  // if (req.headers['test-token'] === secret.test.token) {
  //     req.currentUser = {
  //       id:dummyUserId,
  //       fullName: 'test man',
  //       email: 'yishaluo@gmail.com',
  //       groups: ['scanner'],
  //       iat: Math.floor(Date.now()),
  //       exp: Math.floor(Date.now()) + 3600,
  //       barcode: dummyUserId,
  //     }
  //   }
  return (req.currentUser && (req.currentUser.groups.indexOf('lims/scanner')>=0));
}

export function beAdmin(req) {
  return (req.currentUser && (req.currentUser.groups.indexOf('administrators')>=0 || req.currentUser.groups.indexOf('lims/administrators')>=0));
}

export function beRackScanner(req) {
  if (req.headers['token'] === secret.rackScannerToken) {
      req.currentUser = {
        id:dummyUserId,
        fullName: 'FluidX Scanner',
        email: 'cailab.bio@gmail.com',
        groups: ['lims/rackScanner'],
        iat: Math.floor(Date.now()),
        exp: Math.floor(Date.now()) + 3600,
        barcode: dummyUserId,
      }
      return true;
    }
  return false;
}

export function beARScanner(req) {
  if (req.headers['token'] === secret.ARScannerToken) {
      req.currentUser = {
        id:dummyUserId,
        fullName: 'AR Scanner',
        email: 'cailab.bio@gmail.com',
        groups: ['lims/ARScanner'],
        iat: Math.floor(Date.now()),
        exp: Math.floor(Date.now()) + 3600,
        barcode: dummyUserId,
      }
    return true;
  }
  return false;
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