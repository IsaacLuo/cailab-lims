import {Express, Response, NextFunction} from 'express'
import {Request, IUserJWT} from './MyRequest'
import cors from 'cors'
import * as bodyParser from 'body-parser'
import mongoose from 'mongoose'
import secret from '../secret.json'
import jwt from 'jsonwebtoken'
import log4js from 'log4js'

export default function preprocess(app :Express) {
  app.use(cors())

  app.use(bodyParser.json({ type: 'application/json' , limit:'10MB'}))

  log4js.configure({
    appenders: {
      console: { type: 'console' },
      file: {
        type: 'file',
        filename: 'logs/access.log',
        maxLogSize: 1024,
        backups:3,
      },
    },
    categories: {
      default: {
        appenders: ['console', 'file'],
        level: 'info',
      } 
    }
  })

  app.use((req :Request, res :Response, next: NextFunction) => {
    const loggerFile = log4js.getLogger();
    loggerFile.info(`${req.ip}: ${req.method} ${req.path}`);
    req.log = loggerFile;
    res.set('Cache-Control', 'public, max-age=1');
    next();
  });

  app.use(async (req :Request, res :Response, next: NextFunction) => {
    const mongooseState = mongoose.connection.readyState;
    switch (mongooseState) {
      case 3:
      case 0:
      await mongoose.connect(
        secret.mongoDB.url,
        {
          useNewUrlParser: true,
          user: secret.mongoDB.username,
          pass: secret.mongoDB.password, 
        }
      );
      break;
    }
    next();
  });

  // get user group
  app.use((req :Request, res :Response, next: NextFunction) => {
    const auth = req.headers.authorization;
    if (auth) {
      const [tokenType, token] = auth.split(' ');
      if (tokenType === 'bearer') {  
        jwt.verify(token, secret.jwt.key, (err, decoded :IUserJWT) => {
          if (!err) {
            req.currentUser = decoded;
          } else {
            req.log.info(`${req.ip}: user not logged in`);
          }
          next();
        })
      } else {
        res.status(401).json('unacceptable token');
      }
    } else {
      next();
    }
  })
}