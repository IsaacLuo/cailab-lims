import { 
  Ctx,
  Next,
} from './types';
import koa from 'koa';
import koaBody from 'koa-body';
import middleware from './middleware'
import Router from 'koa-router';
import log4js from 'log4js';
import conf from '../conf';
import crypto from 'crypto';
import {Part, PartDeletionRequest} from './models';
import jwt from 'jsonwebtoken';
import cors from '@koa/cors';
import handleSessions from './rest/session';
import handleUsers from './rest/user';
import { userMust, beAdmin } from './identifyUsers';
import handleParts from './rest/part';
import koaStatic from 'koa-static';
import path from 'path';
import handleContainers from './rest/container';
import handleAttachment from './rest/attachment';
import handleLocations from './rest/location';
import handlePicklists from './rest/picklists';
import handleTubes from './rest/tube';
import handleComments from './rest/comment';


const app = new koa();
const router = new Router();

app.use(koaStatic('static'));

app.use(cors({credentials: true}));
app.use(koaBody({multipart:true}));
middleware(app);
handleUsers(app, router);
handleSessions(app, router);
handleParts(app, router);
handleContainers(app, router);
handleAttachment(app, router);
handleLocations(app, router);
handlePicklists(app, router);
handleTubes(app, router);
handleComments(app, router);

router.get('/', async (ctx:Ctx)=> {
  ctx.body={message:'server: cailab-lims'};
})

router.get(
  '/api/statistic',
  async (ctx:Ctx, next:Next)=> {
    try {
      const ret:any = {};
      ret.count = {};
      ret.count.bacteria = await Part.countDocuments({sampleType:'bacterium'}).exec();
      ret.count.primers = await Part.countDocuments({sampleType:'primer'}).exec();
      ret.count.yeasts = await Part.countDocuments({sampleType:'yeast'}).exec();
      ret.monthlyStatistic = await Part.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(Date.now()-365*24*3600000),
            }
          }
        }, {
          $project: {
            ym: {
              $dateToString: {
                format: '%Y-%m', 
                date: '$createdAt'
              }
            }
          }
        }, {
          $group: {
            _id: '$ym', 
            count: {
              $sum: 1
            }
          }
        }, {
          $sort: {
            _id: 1
          }
        }
      ]);
      ctx.body = ret;
    } catch (err) {
      ctx.throw(500);
    }
  }
);

// router.get(
//   '/api/notifications',
//   userMust(beAdmin),
//   async (ctx:Ctx, next:Next)=> {
//     const notifications:{title:string, message:string, link:string}[] = [];
//     const sudoRequestCount = await PartDeletionRequest.countDocuments({}).exec();
//     if (sudoRequestCount>0) {
//       notifications.push({
//         title: 'requests from users', 
//         message: `You have ${sudoRequestCount} request${sudoRequestCount === 1? '': 's'} of deleting parts`,
//         link: '/requests/partsDeletion',
//       });
//     }
//     ctx.body = {notifications};
// });

app.use(router.routes());

app.listen(8000, '0.0.0.0');
log4js.getLogger().info('start listening at 8000 ' );
