import {
  Ctx, Next,
} from '../types';

import koa from 'koa';
import Router from 'koa-router';

import { userMust, beAdmin, beUser } from '../identifyUsers'
import { User, LogLogin } from '../models';
import jwt from 'jsonwebtoken';
import secret from '../../secret';
import conf from '../../conf';
import axios from 'axios';

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
      ctx.body = users;
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
    '/api/user/current/detail',
    async (ctx:Ctx, next: Next)=> {
      const user = ctx.state.user;
      const currentUser = await User.findById(user._id).exec();
      if (currentUser) {
        ctx.body = currentUser;
      } else {
        ctx.throw(404);
      }
    }
  );

  /**
   * when user logged in to cailab and get a token, he needs to sync the information to lims
   */
  router.put(
    '/api/user/current/syncRequest',
    userMust(beUser),
    async (ctx:Ctx, next:Next)=> {
      // update stroaged user information
      const user = ctx.state.user;
      const currentUser = await User.findById(user._id).exec();
      // get information from auth server
      let authUser;
      try {
        const authServerResponse = await axios.get(
          `${conf.authServerAddress}/api/user/current?full=true`,
          {headers:{authorization: `Bearer ${ctx.state.userToken}`}}
        );
        authUser = authServerResponse.data.user;
      } catch (err) {
        console.error(err.message);
        console.error(err.response.data);
        ctx.throw(err.response.state, 'some thing wrong in auth server');
      }
      const now = new Date();
      let updated = false;
      if (currentUser) {
        if (currentUser.name !== authUser.name) {
          currentUser.name = authUser.name;
          updated = true;
        }
        if (currentUser.email !== authUser.email) {
          currentUser.email = authUser.email;
          updated = true;
        }
        if (JSON.stringify(currentUser.groups) !== JSON.stringify(authUser.groups)) {
          currentUser.groups = authUser.groups;
          updated = true;
        }
        if (authUser.abbr) {
          if (currentUser.abbr !== authUser.abbr) {
            currentUser.abbr = authUser.abbr;
            updated = true;
          }
        } else {
          if (!currentUser.abbr) {
            currentUser.abbr = currentUser.name.split(' ').slice(0,2).map(v=>v[0]).join('').toUpperCase();
            updated = true;
          }
        }
        if(updated) {
          currentUser.updatedAt = now;
          await currentUser.save();
        }
        ctx.body = {updated, user};
      } else {
        await User.create({
          ...authUser,
          abbr: authUser.abbr || authUser.name.split(' ').slice(0,2).map(v=>v[0]).join('').toUpperCase(),
        });
        ctx.body = {created: true, user:authUser};
      }
    }
  )

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
    ctx.body = users;
  });


}