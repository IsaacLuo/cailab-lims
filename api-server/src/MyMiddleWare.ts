import {Response, NextFunction} from 'express'
import {Request} from './MyRequest'
import secret from '../secret.json'

export function userMustBeAdmin (req :Request, res :Response, next: NextFunction) {
    if (req.currentUser && req.currentUser.groups.indexOf('administrators')>=0) {
      req.log.info('currentGoup', req.currentUser.groups)
      next();
    } else if (req.headers['test-token'] === secret.test.token) {
      req.currentUser = {
        id:'5bbc83c69d995c65943a57d1',
        fullName: 'test man',
        email: 'yishaluo@gmail.com',
        groups: ['users'],
        iat: Math.floor(Date.now()),
        exp: Math.floor(Date.now()) + 3600,
        barcode: '5bbc83c69d995c65943a57d1',
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
        id:'5bbc83c69d995c65943a57d1',
        fullName: 'test man',
        email: 'yishaluo@gmail.com',
        groups: ['users'],
        iat: Math.floor(Date.now()),
        exp: Math.floor(Date.now()) + 3600,
        barcode: '5bbc83c69d995c65943a57d1',
      }
    }
    if (req.currentUser && req.currentUser.groups.indexOf('users')>=0) {
      next();
    } else {
      req.log.warn(`guest is trying to access admin functions ${req.url}`);
      res.status(401).json({message: 'require log in'})
    }
  }

  export function userCanUseScanner (req :Request, res :Response, next: NextFunction) {
    if (req.headers['test-token'] === secret.test.token) {
      req.currentUser = {
        id:'5bbc83c69d995c65943a57d1',
        fullName: 'test man',
        email: 'yishaluo@gmail.com',
        groups: ['scanner'],
        iat: Math.floor(Date.now()),
        exp: Math.floor(Date.now()) + 3600,
        barcode: '5bbc83c69d995c65943a57d1',
      }
    }
    if (req.currentUser && (req.currentUser.groups.indexOf('scanner')>=0 || req.currentUser.groups.indexOf('users')>=0)) {
      // console.log(`${req.currentUser.fullName} is ready for scanning`);
      next();
    } else {
      req.log.warn(`guest is trying to access admin functions ${req.url}`, req.currentUser);
      res.status(401).json({message: 'require log in'})
    }
  }