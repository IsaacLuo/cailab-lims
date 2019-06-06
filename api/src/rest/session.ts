import { 
  Ctx,
  Next, 
} from '../types';

import koa from 'koa';
import Router from 'koa-router';

import {userMust, beAdmin, beUser} from '../identifyUsers'
import { User, LogLogin } from '../models';
import jwt from 'jsonwebtoken';
import secret from '../../secret';

export default function handleSessions (app:koa, router:Router) {

  /**
   * when user use a scanner and scan his barcode to login
   * @body : {barcode}
   */
  router.post('/api/scannerSessions/',
    async (ctx:Ctx, next:Next)=> {
      const {barcode} = ctx.request.body;
      if(!barcode) {
        ctx.throw(406, 'barcode is required');
      }
      const user = await User.findOne({barcode}).exec();
      if (!user) {
        ctx.throw(406, 'invalid user');
      }

      const {_id, name, email, groups} = user;

      if (groups.indexOf('scanner')<0) {
        throw new Error('invalid user');
      }
      const token = jwt.sign({
        _id,
        fullName: name,
        email,
        groups:['scanner'], // user who only provide barcode get the scanner group only
      }, 
      secret.jwt.key,
      {expiresIn:'1h'});
      
      LogLogin.create({
        operator: _id,
        operatorName: name,
        type: 'login',
        sourceIP: ctx.request.ip,
        timeStamp: new Date(),
      });
      console.log(`scanner logged in as ${name}`);
      ctx.body = {message: `welcome ${name} on scanner`, _id, token, name, email, groups:['scanner']};
  });


}