import { ISearchRackBarcodeState } from './../../../frontend/src/types';
import {Express, Response} from 'express'
import {User, Part, FileData, PartsIdCounter, PartDeletionRequest, PartHistory, LogOperation, Tube, RackScannerRecord} from '../models'
import {Request} from '../MyRequest'
import {userMustLoggedIn,userCanUseScanner, fromFluidXScanner, userMustBeAdmin} from '../MyMiddleWare'
import sendBackXlsx from '../sendBackXlsx'
import mongoose from 'mongoose'
import { IPart, IAttachment, IPartForm } from '../types';
import { json } from 'body-parser';
import { NextFunction } from 'connect';
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
      // save a scanning record
      const record = new RackScannerRecord();
      record.createdAt = new Date();
      record.rackBarcode = rackBarcode;
      record.tubes = req.body.tubes.map(v => ({
        wellName: v.location,
        wellId: v.locationIndex,
        barcode: v.barcode,
      }));

      promises.push(record.save());

      Promise.all(promises)
      .then(()=>res.json({message:'OK'}))
      .catch((err) => res.status(406).send(err.message));
    } catch (err) {
      res.status(406).send(err.message);
    }
  });

  /**
   * get a tube rack data from given rackBarcode and full
   * @param req.rackBarcode string, the barcode of the rack
   * @param req.full boolean, true: show all details of the tubes, false, hide details of tubes
   */
  async function getTubeRack(req :Request, res: Response) {
    try {
      const {rackBarcode, full} = req.customData;
      const tubes = await Tube.find({rackBarcode}).exec();
      if (tubes.length === 0) {
        throw new Error('unable to find the rack');
      }
      if (full) {
        const t2 = tubes.map(v => 
          Part.findOne({'containers.barcode': v.barcode}).exec().then(part => {
            if(part) {
              v.part = part;
              return new Promise((solve, reject)=>solve())
            }
            })
        );
        Promise.all(t2).then(()=>res.json({tubes, full:true}));
      } else {
        res.json({tubes});
      }
    } catch (err) {
      res.status(404).send(err.message);
    }
  }

  /**
   * get latest verified rack
   */
  app.get('/api/tubeRack/lastVerified', userCanUseScanner, async (req :Request, res: Response, next: NextFunction) => {
    const {full} = req.query;
    try {
      const rack = await RackScannerRecord.find({}).select('rackBarcode').sort({createdAt:-1}).limit(1).exec();
      if(rack.length === 0) {
        res.status(404).send('no record');
        return;
      }
      const rackBarcode = rack[0].rackBarcode;
      req.customData = {rackBarcode, full};
      next();
    } catch (err) {
      res.status(404).send(err.message);
    }
  }, getTubeRack);

  /**
   * get a rack
   */
  app.get('/api/tubeRack/:rackBarcode', userCanUseScanner, async (req :Request, res: Response, next: NextFunction) => {
    const {rackBarcode} = req.params;
    const {full} = req.query;
    req.customData = {rackBarcode, full};
    next();
  }, getTubeRack);

  

}