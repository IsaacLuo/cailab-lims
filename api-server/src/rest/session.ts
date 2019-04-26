import axios from 'axios';
import {Express, Response} from 'express'
import {User, LogLogin} from '../models'
import {Request} from '../MyRequest'
import mongoose from 'mongoose'

import secret from '../../secret.json'
import jwt from 'jsonwebtoken'


const ObjectId = mongoose.Types.ObjectId;


export default function handleSession(app:Express) {

  /**
   * create session, read token from cookie, verify it on cailab-auth, then create session locally
   */
  app.post('/api/session/', async (req :Request, res: Response) => {
    try {
      const {token} = req.cookies;
      if (!token) {
        res.status(404).json({message: 'unable to login, no token'});
      }
      // verify toekn in cailab-auth
      const cailabAuthResponse = await axios.get('https://api.auth.cailab.org/api/user/current', {headers: {Authorization: `Bearer ${token}`}});
      console.log(cailabAuthResponse);
      if (cailabAuthResponse.status === 200 && cailabAuthResponse.data.message==='OK' && cailabAuthResponse.data.user) {
        // user verified
        const {_id, fullName, email, groups} = cailabAuthResponse.data.user;
        let user = await User.findOne({email, authType: 'cailab'}).exec();
        const now = new Date();
        if (!user) {
          user = await User.findOneAndUpdate(
            {email, authType: 'cailab'},
            {
              _id,
              authType: 'cailab',
              name: fullName,
              email, 
              groups,
              createdAt: now,
              updatedAt: now,
              abbr: fullName.split(' ').map(v=>v[0]).join('')
            },
            {new: true, upsert: true}
          ).exec();
        } else {
          user = await User.findOneAndUpdate(
              {email, authType: 'cailab'},
              {
                name: fullName,
                groups,
              },
              {new: true, upsert: true}
            ).exec();
        }
        const token = jwt.sign({
          id:user._id,
          fullName: user.name,
          email: user.email,
          groups: user.groups,
          abbr: user.abbr,
        }, 
        secret.jwt.key,
        {expiresIn:'1h'})
        // log to database
        LogLogin.create({
          operatorId: user._id,
          operatorName: user.name,
          type: 'login',
          sourceIP: req.ip,
          timeStamp: new Date(),
        });
        res.json({message: `welcome ${user.name}`, id:user._id, token, name:user.name, email:user.email, groups:user.groups, abbr: user.abbr});
      } else {
        res.status(404).json({message: 'username of password is incorrect'});
      }
      
      // var hash=crypto.createHmac('sha1', app_secret).update(args).digest().toString('base64');
    } catch (err) {
      res.status(401).send(err.message);
    }
  });

}