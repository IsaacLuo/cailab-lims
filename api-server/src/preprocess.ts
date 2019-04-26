import {Express, Response, NextFunction} from 'express'
import {Request, IUserJWT} from './MyRequest'
import cors from 'cors'
import * as bodyParser from 'body-parser'
import mongoose from 'mongoose'
import secret from '../secret.json'
import jwt from 'jsonwebtoken'
import log4js from 'log4js'
import cookieParser from 'cookie-parser';

export default function preprocess(app :Express) {

  var whitelist = ['http://local.cailab.org:9000', 'https://lims-dev.cailab.org', 'https://lims.cailab.org'];
  var corsOptions = {
    origin: function (origin, callback) {
      console.log('originfrom', origin)
      if (whitelist.indexOf(origin) !== -1) {
        console.log('allow origin')
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
  }

  app.use(cors(corsOptions))
  app.use(cookieParser())

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
    res.set('Access-Control-Max-Age', '3600');
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
      if (tokenType === 'bearer' || tokenType === 'Bearer' ) {
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