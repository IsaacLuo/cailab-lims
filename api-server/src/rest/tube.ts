import {Express, Response} from 'express'
import {User, Part, FileData, PartsIdCounter, PartDeletionRequest, PartHistory, LogOperation, Container} from '../models'
import {Request} from '../MyRequest'
import {userMustLoggedIn,userCanUseScanner, userMustBeAdmin} from '../MyMiddleWare'
import sendBackXlsx from '../sendBackXlsx'
import mongoose from 'mongoose'
import { IPart, IAttachment, IPartForm } from '../types';
import { json } from 'body-parser';
const ObjectId = mongoose.Types.ObjectId;

export default function handleTube(app:Express) {

  /**
   * get a tube
   */
  app.get('/api/tubes/', userCanUseScanner, async (req :Request, res: Response) => {
    try {
      let containers = await Container.find({ctype:'tube'}).exec();
      let totalCount = await Container.countDocuments({ctype:'tube'}).exec();
      res.json({containers, totalCount});
    } catch (err) {
      res.status(404).send(err.message);
    }
  });

  /**
   * get a tube
   */
  app.get('/api/tube/:barcode/content', userCanUseScanner, async (req :Request, res: Response) => {
    const {barcode} = req.params;
    try {
      let part = await Part.findOne({'containers.ctype':'tube', 'containers.barcode':barcode}).exec();
      if (!part) throw new Error('tube not found');
      res.json(part);
    } catch (err) {
      res.status(404).send(err.message);
    }
  });

  /**
   * delete a tube
   * search in all parts, then delete it, a tube should only belongs a part.
   * this will remove barcode by force, so only admin can call this API, normal user 
   * should call DELETE /api/part/:partId/tube/:tubeId to delete a tube
   * @param id, the tube barcode
   */
  app.delete('/api/tube/:barcode', userMustBeAdmin, async (req :Request, res: Response) => {
    const {barcode} = req.params;
    try {
      let part = await Part.findOne({'containers.ctype':'tube', 'containers.barcode':barcode}).exec();
      if (!part) throw new Error('tube not found');
      part.containers = part.containers.filter(v=> !(v.ctype === 'tube' && v.barcode === barcode));
      await part.save();
      res.json(part);
    } catch (err) {
      res.status(404).send(err.message);
    }
  });

}