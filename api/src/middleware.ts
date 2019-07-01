import { ICustomState, Ctx, Next } from './types';
import koa from 'koa';
import log4js, {Appender, LogLevelFilterAppender} from 'log4js';
import mongoose from 'mongoose';
import conf from '../conf';
import koaJwt from 'koa-jwt';
import jwt from 'jsonwebtoken';

const mainAppender:LogLevelFilterAppender = {
  type: 'logLevelFilter',
  appender: 'default.log',
  level: 'DEBUG',
}

log4js.configure({
  appenders: {
    file: {
      type: 'file',
      filename: 'logs/access.log',
      maxLogSize: 1024,
      backups:0,
    },
    console: {
      type: 'console',
    }
  },
  categories: {
    default: {
      appenders: ['console', 'file'],
      level: 'debug',
    }
  }
});

export default function middleware (app:koa) {
  const logger = log4js.getLogger();

  // 500 middleware
  app.use( async (ctx, next)=> {
    try {
      await next();
    } catch(err) {
      logger.error('>>>>error', err.message);
      ctx.response.status = err.statusCode || err.status || 500;
      ctx.response.body = {
        message: err.message,
      }
      ctx.app.emit('error', err, ctx);
    }
  });

  // log
  app.use( async (ctx:Ctx, next:Next)=> {
    logger.info(ctx.request.ip, ctx.method, ctx.URL.pathname);
    ctx.state.logger = logger;
    // ctx.throw(401);
    await next();
    logger.info(ctx.response.status);
  });

  // mongodb
  app.use( async (ctx:Ctx, next:Next)=> {
    try {
      const mongooseState = mongoose.connection.readyState;
      switch (mongooseState) {
        case 3:
        case 0:
        await mongoose.connect(
          conf.secret.mongoDB.url,
          {
            useNewUrlParser: true,
            user: conf.secret.mongoDB.username,
            pass: conf.secret.mongoDB.password, 
          }
        );
        break;
      }
    } catch(error) {
      ctx.throw(500,'db connection error');
    }
    await next();
    
  });

  // always json type
  app.use( async (ctx:Ctx, next:Next)=> {
    ctx.type = 'json';
    // ctx.body = {};
    await next();
  });


    app.use(koaJwt({
    secret: conf.secret.jwt.key,
    cookie: 'token',
    passthrough: true,
    // getToken: (ctx) => { 
    //   const auth = ctx.headers['authorization'];
    //   if(auth) {
    //     const [first, second] = auth.split(' ');
    //     if (first === 'Bearer') {
    //       return second;
    //     }
    //   }
    //   if(ctx.headers['token']) {
    //     return ctx.headers['token']
    //   }
    //   const urlToken = ctx.URL.searchParams.get('token');
    //   if(urlToken) {
    //     return urlToken;
    //   }
    //   return null;
    // }
  })
  // .unless({
  //   path: [
  //     '/',
  //     '/api/statistic',
  //     /^\/api\/tubeRack\/\w+$/,
  //     // {url: /^\/api\/tubeRack\/\w+$/, method: ['PUT']},
  //   ]
  // })
  )
  // record user token
  app.use( async (ctx:Ctx, next:Next)=> {
    if (ctx.headers.authorization) {
      ctx.state.userToken = ctx.headers.authorization.split(' ')[1];
    } else if (ctx.cookies.get('token')) {
      ctx.state.userToken = ctx.cookies.get('token');
    }
    
    await next();
  });

}