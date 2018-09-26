import {Express, Response, NextFunction} from 'express'
import {Request, IUserJWT} from './MyRequest'
import cors from 'cors'
import * as bodyParser from 'body-parser'
import mongoose from 'mongoose'
import secret from '../secret.json'
import jwt from 'jsonwebtoken'

export default function preprocess(app :Express) {
  app.use(cors())

  app.use(bodyParser.json({ type: 'application/json' , limit:'10MB'}))

  app.use((req :Request, res :Response, next: NextFunction) => {
    console.log(`${req.method} ${req.path}`)
    res.set('Cache-Control', 'public, max-age=1');
    next();
  });

  app.use(async (req :Request, res :Response, next: NextFunction) => {
    const mongooseState = mongoose.connection.readyState;
    switch (mongooseState) {
      case 3:
      case 0:
      console.log('mongooseState=', mongooseState);
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
            // console.log('verified user');
            // console.log(decoded);
            req.currentUser = decoded;
          } else {
            console.log('bad verification');
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