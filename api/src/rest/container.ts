import { 
  Ctx,
  Next,
} from '../types';

import { 
  Container,
} from './../models';

import koa from 'koa';
import Router from 'koa-router';
import {userMust, beAdmin, beUser, beScanner} from '../identifyUsers'

/**
 * handles the CURD of containers
 * GET /api/containers
 */
export default function handleContainers (app:koa, router:Router) {
    router.get(
    '/api/containers',
    userMust(beUser, beScanner),
    async (ctx:Ctx, next:Next) => {
      try {
        let containers = await Container.find().exec();
        let totalCount = await Container.countDocuments().exec();
        ctx.body = {containers, totalCount};
      } catch (err) {
        ctx.state.logger.error(err)
        ctx.throw(404);
      }
    }
  );
}