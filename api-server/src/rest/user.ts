import {Express, Response} from 'express'
import {User, Part, FileData, PartsIdCounter, PartDeletionRequest, PartHistory, LogOperation, Container} from '../models'
import {Request} from '../MyRequest'
import {beAdmin, beUser, or} from '../MyMiddleWare'
import sendBackXlsx from '../sendBackXlsx'
import mongoose from 'mongoose'
import { IPart, IAttachment, IPartForm } from '../types';
import { json } from 'body-parser';
import crypto from 'crypto';

import {HMAC_KEY} from '../../secret.json'

const ObjectId = mongoose.Types.ObjectId;

export default function handleUsers(app:Express) {

  function verifyUserForm (form) :boolean {
    const {
      name,
      email,
      password,
      abbr,
      groups,
    } = form;

    if(!/^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(email)) {
      return false;
    }
    if(!(password.length >=8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password))) {
      return false;
    }
    if(!/^[A-Z][A-Z]$/.test(abbr)) {
      return false;
    }

    return true;
  }

  /**
   * new user
   */
  app.post('/api/user/', async (req :Request, res: Response) => {
    try {
      const {
        name,
        email,
        password,
        abbr,
        groups,
      } = req.body;
      const passwordSalt = Math.random().toString(36).substring(2);
      const passwordHash = crypto.createHmac('sha256', HMAC_KEY).update(password+passwordSalt).digest().toString('base64');
      // save user information
      const userCount = await User.countDocuments({email}).exec();
      if (userCount > 0) {
        res.status(409).json({message: `user ${email} exists`});
        return;
      }
      // verify abbr is unique
      const abbrCount = await User.countDocuments({abbr}).exec();
      if (abbrCount > 0) {
        res.status(409).json({message: `abbr ${abbr} is used by another user`});
        return;
      }

      const now = new Date();
      const user = new User({
        email,
        name,
        abbr,
        groups: [],
        createdAt: now,
        updatedAt: now,
        authType: 'local',
        passwordHash,
        passwordSalt,
      });
      await user.save();
      console.log(name, email, abbr, groups, passwordHash, passwordSalt);
      res.json({_id: user._id});

    } catch (err) {
      res.status(401).send(err.message);
    }
  });

  /**
   * update user
   */
  app.put('/api/user/:id', or(beUser,beAdmin), async (req :Request, res: Response) => {
    const {id} = req.params;
    try {
      const user = await User.findOne({_id:id}).exec();
      if(!user) {
        throw new Error('user not found');
      }

      const {
        name,
        email,
        password,
        abbr,
        groups,
      } = req.body;


      let passwordSalt, passwordHash;

      if (password) {
        passwordSalt = Math.random().toString(36).substring(2);
        passwordHash = crypto.createHmac('sha256', HMAC_KEY).update(password+passwordSalt).digest().toString('base64');
      }

      // verify abbr is unique
      const abbrCount = await User.countDocuments({_id:{$ne:id}, abbr}).exec();
      if (abbrCount > 0) {
        throw new Error(`abbr ${abbr} duplicated`);
      }

      const now = new Date();
      const updateDict = {name, email, abbr, groups, passwordHash, passwordSalt, updatedAt:now};
      // remove undefined keys
      for(const key in updateDict) {
        if(updateDict[key] === undefined) delete updateDict[key];
      }
      await User.updateOne({_id:id}, updateDict);
      res.json({message:'OK'});

    } catch (err) {
      res.status(401).send(err.message);
    }
  });

}
