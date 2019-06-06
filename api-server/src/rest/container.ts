import {Express, Response} from 'express'
import {Container} from '../models'
import {Request} from '../MyRequest'
import {or, beScanner, beUser} from '../MyMiddleWare'
import sendBackXlsx from '../sendBackXlsx'
import mongoose from 'mongoose'
import { IPart, IAttachment, IPartForm } from '../types';
const ObjectId = mongoose.Types.ObjectId;

export default function handleContainers(app:Express) {
  /**
   * get containers
   */
  app.get('/api/containers/', or(beScanner, beUser), async (req :Request, res: Response) => {
    try {
      let containers = await Container.find().exec();
      let totalCount = await Container.countDocuments().exec();
      res.json({containers, totalCount});
    } catch (err) {
      res.status(404).send(err.message);
    }
  });

}
