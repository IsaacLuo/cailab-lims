import {Express, Response} from 'express'
import {User, Part, FileData, PartsIdCounter, PartDeletionRequest, PartHistory, LogOperation, Container} from '../models'
import {Request} from '../MyRequest'
import {userMustLoggedIn,userCanUseScanner, userMustBeAdmin} from '../MyMiddleWare'
import sendBackXlsx from '../sendBackXlsx'
import mongoose from 'mongoose'
import { IPart, IAttachment, IPartForm } from '../types';
import { json } from 'body-parser';
import crypto from 'crypto';

import {HMAC_KEY} from '../../secret.json'

const ObjectId = mongoose.Types.ObjectId;

export default function handleUsers(app:Express) {

  /**
   * new user
   */
  app.post('/api/user/', userMustBeAdmin, async (req :Request, res: Response) => {
    try {
      const {
        name,
        email,
        password,
        abbr,
        groups,
      } = req.body;
      const salt = Math.random().toString(36).substring(2);
      const hash = crypto.createHmac('sha256', HMAC_KEY).update(password).digest().toString('base64');
      // save user information
      const userCount = await User.countDocuments({email: email}).exec();
      if (userCount > 0) {
        throw new Error('user exists');
      }
      const now = new Date();
      const user = new User({
        email,
        name,
        abbr,
        groups,
        createdAt: now,
        updatedAt: now,
        authType: 'local',
        passwordHash: hash,
        passwordSalt: salt,
      });
      await user.save();
      console.log(name, email, abbr, groups, hash, salt);
      res.json({_id: user._id});

    } catch (err) {
      res.status(401).send(err.message);
    }
  });

}
