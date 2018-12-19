import {Express, Response} from 'express'
import {User, Part, FileData, PartsIdCounter, PartDeletionRequest, PartHistory, LogOperation, Tube} from '../models'
import {Request} from '../MyRequest'
import {userMustLoggedIn,userCanUseScanner, fromFluidXScanner, userMustBeAdmin} from '../MyMiddleWare'
import sendBackXlsx from '../sendBackXlsx'
import mongoose from 'mongoose'
import { IPart, IAttachment, IPartForm } from '../types';
import { json } from 'body-parser';
const ObjectId = mongoose.Types.ObjectId;

export default function handleTubeRack(app:Express) {
  /**
   * update a rack
   */
  app.put('/api/tubeRack/:rackBarcode', fromFluidXScanner, async (req :Request, res: Response) => {
    const {rackBarcode} = req.params;
    try {
      // save tubes
      const promises = req.body.tubes.map(v=> Tube.update(
        {
          barcode: v.barcode,
        }, {
          rackBarcode: rackBarcode,
          wellName: v.location,
          wellId: v.locationIndex,
          verifiedAt: new Date(),
        }, {
          upsert:true,
        }));
      Promise.all(promises)
      .then(()=>res.json({message:'OK'}))
      .catch((err) => res.status(406).send(err.message));

    } catch (err) {
      res.status(406).send(err.message);
    }
  });

  /**
   * get a rack
   */
  app.get('/api/tubeRack/:rackBarcode', userCanUseScanner, async (req :Request, res: Response) => {
    const {rackBarcode} = req.params;
    const {full} = req.query;
    try {
      const tubes = await Tube.find({rackBarcode}).exec();
      if (full) {
        const t2 = tubes.map(v => 
          Part.findOne({'containers.barcode': v.barcode}).exec().then(part => t2.part = part)
        );
        Promise.all(t2).then(()=>res.json({tubes}));
      } else {
        res.json(tubes);
      }
    } catch (err) {
      res.status(404).send(err.message);
    }
  });

}