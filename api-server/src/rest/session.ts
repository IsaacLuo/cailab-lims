import {Express, Response} from 'express'
import {User, Part, FileData, PartsIdCounter, PartDeletionRequest, PartHistory, LogOperation, Container} from '../models'
import {Request} from '../MyRequest'
import {userMustLoggedIn,userCanUseScanner, userMustBeAdmin} from '../MyMiddleWare'
import sendBackXlsx from '../sendBackXlsx'
import mongoose from 'mongoose'
import { IPart, IAttachment, IPartForm } from '../types';
import { json } from 'body-parser';
import {HMAC_KEY} from '../../secret.json'
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
      // var hash=crypto.createHmac('sha1', app_secret).update(args).digest().toString('base64');
      res.json({message:'OK'});
    } catch (err) {
      res.status(401).send(err.message);
    }
  });

}