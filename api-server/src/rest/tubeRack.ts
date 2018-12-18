import {Express, Response} from 'express'
import {User, Part, TubeRack, FileData, PartsIdCounter, PartDeletionRequest, PartHistory, LogOperation} from '../models'
import {Request} from '../MyRequest'
import {userMustLoggedIn,userCanUseScanner, userMustBeAdmin} from '../MyMiddleWare'
import sendBackXlsx from '../sendBackXlsx'
import mongoose from 'mongoose'
import { IPart, IAttachment, IPartForm } from '../types';
import { json } from 'body-parser';
const ObjectId = mongoose.Types.ObjectId;

export default function handleTubeRack(app:Express) {
  /**
   * update a rack
   */
  app.put('/api/tubeRack/:barcode', userCanUseScanner, async (req :Request, res: Response) => {
    const {barcode} = req.params;
    try {
      let rack = await TubeRack.findOne({barcode,}).exec();
      if(!rack) {
        rack = new TubeRack();
      }
      rack.ctype = req.body.ctype;
      rack.barcode = barcode;
      rack.tubes = req.body.tubes.map(v=>({
        location: v.location,
        locationIndex: v.locationIndex,
        barcode: v.barcode,
        contentId: v.contentId,
        contentName: v.contentName,
      })).sort((v1,v2)=>v1.locationIndex - v2.locationIndex)
      await rack.save();
      res.json(rack);
    } catch (err) {
      res.status(406).send(err.message);
    }
  });

  /**
   * get a rack
   */
  app.get('/api/tubeRack/:barcode', userCanUseScanner, async (req :Request, res: Response) => {
    const {barcode} = req.params;
    try {
      let rack = await TubeRack.findOne({barcode,}).exec();
      if(!rack) {
        throw new Error('unbale to find the rack');
      }
      res.json(rack);
    } catch (err) {
      res.status(404).send(err.message);
    }
  });

}