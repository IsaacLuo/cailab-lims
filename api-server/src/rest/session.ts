import {Express, Response} from 'express'
import {User, Part, FileData, PartsIdCounter, PartDeletionRequest, PartHistory, LogOperation, Container, LogLogin} from '../models'
import {Request} from '../MyRequest'
import {userMustLoggedIn,userCanUseScanner, userMustBeAdmin} from '../MyMiddleWare'
import sendBackXlsx from '../sendBackXlsx'
import mongoose from 'mongoose'
import { IPart, IAttachment, IPartForm } from '../types';
import { json } from 'body-parser';
import secret, {HMAC_KEY} from '../../secret.json'
import crypto from 'crypto';
import jwt from 'jsonwebtoken'


const ObjectId = mongoose.Types.ObjectId;


export default function handleSession(app:Express) {

  /**
   * get a tube
   */
  app.post('/api/session/', async (req :Request, res: Response) => {
    try {
      const {username, password} = req.body;
      if(!username || !password) {
        throw new Error('invalid username or password');
      }
      const user = await User.findOne({email:username}).exec();
      if (!user) {
        res.status(404).json({message: 'username of password is incorrect'});
      }
      
      const {passwordHash, passwordSalt} = user;
      const passwordHash2 = crypto.createHmac('sha256', HMAC_KEY).update(password+passwordSalt).digest().toString('base64');
      if(passwordHash === passwordHash2) {
        const token = jwt.sign({
          id:user._id,
          fullName: user.name,
          email: user.email,
          groups: user.groups,
        }, 
        secret.jwt.key,
        {expiresIn:'1h'})
        // generate a new barcode of user
        user.barcode = crypto.createHash('md5').update(token).digest("hex");
        user.save();

        // log to database
        LogLogin.create({
          operatorId: user._id,
          operatorName: user.name,
          type: 'login',
          sourceIP: req.ip,
          timeStamp: new Date(),
        });
        res.json({message: `welcome ${user.name}`, id:user._id, token, name:user.name, email:user.email, groups:user.groups})
      } else {
        res.status(404).json({message: 'username of password is incorrect'});
      }
      
      // var hash=crypto.createHmac('sha1', app_secret).update(args).digest().toString('base64');
      
    } catch (err) {
      res.status(401).send(err.message);
    }
  });

}