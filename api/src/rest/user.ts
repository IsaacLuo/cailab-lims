import {
  Ctx, Next,
} from '../types';

import koa from 'koa';
import Router from 'koa-router';

import { userMust, beAdmin, beUser } from '../identifyUsers'
import { User, LogLogin } from '../models';
import jwt from 'jsonwebtoken';
import secret from '../../secret';

export default function handleUsers(app: koa, router: Router) {

  /**
   * get user names and their id for items in select of part tables
   * @body : {barcode}
   */
  router.get(
    '/api/users/names',
    userMust(beUser),
    async (ctx: Ctx, next: Next) => {
      const users = await User.find({ groups: {$in:['users', 'lims/users']} }).select('_id name').exec();
      ctx.body = {users};
    }
  );

  router.get(
    '/api/user/current',
    async (ctx:Ctx, next: Next)=> {
      const user = ctx.state.user;
      ctx.body = {message:'OK', user,};
      if (user) {
        const now = Math.floor(Date.now() / 1000);
        const eta = ctx.state.user.exp - now;
        ctx.body.eta = eta;
      }
    }
  );

  router.get(
    '/api/user/current/barcode',
    userMust(beUser),
    async (ctx:Ctx, next: Next)=> {
      const user = ctx.state.user;
      const userFull = await User.findById(user._id).exec();
      if (userFull && userFull.barcode) {
        ctx.body = {barcode: userFull.barcode};
      } else {
        ctx.throw(404,{message: 'no barcode'});
      }
    }
  );

  router.get(
    '/api/users',
    userMust(beAdmin),
    async (ctx:Ctx, next: Next)=> {
    let users = await User.find({}).sort({groups: -1, createdAt:1 }).exec();
    ctx.body = {users};
  });


}