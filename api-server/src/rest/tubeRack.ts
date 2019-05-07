import { Container, ContainerGroup, LogOperation } from './../models';
import {Express, Response} from 'express'
import {Part, Tube, RackScannerRecord} from '../models'
import {Request} from '../MyRequest'
import {or, beARScanner, beUser, beRackScanner, beScanner} from '../MyMiddleWare'
import mongoose from 'mongoose'
import { NextFunction } from 'connect';
import config from '../config';
import pushNotification from '../pushNotification';
const ObjectId = mongoose.Types.ObjectId;

export default function handleTubeRack(app:Express) {
  /**
   * update a rack
   */
  app.put('/api/tubeRack/:rackBarcode', or(beRackScanner), async (req :Request, res: Response) => {
    console.log('pub tube rack');
    const {rackBarcode} = req.params;
    const tubeBarcodes = req.body.tubes.map(v=>v.barcode);
    try {
      const now = new Date();
      // get rack container
      let rack = await ContainerGroup.findOne({
        ctype: 'rack',
        barcode: rackBarcode,
      });
      if (!rack) {
        rack = new ContainerGroup({
          ctype: 'rack',
          createdAt: now,
          barcode: rackBarcode,
        });
        await rack.save();
      }

      // remove this rack from tubes which not in the tubeBarcode list.

      const result = await Container.updateMany(
        {
          ctype: 'tube', 
          parentContainer: rack._id, 
          barcode: {$nin:tubeBarcodes}
        },
        {
          parentContainer: undefined,
          verifiedAt: now,
        }
      )

      // save tubes
      const promises = req.body.tubes.map(v=> Container.updateMany(
        {
          ctype: 'tube',
          barcode: v.barcode,
        }, {
          parentContainer: rack,
          wellName: v.location,
          wellId: v.locationIndex,
          verifiedAt: now,
        }, {
          upsert:true,
        }));

      console.log(`updating ${promises.length} tubes`);

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

      await Promise.all(promises);

      // rack is on scanner
      rack.currentStatus = `checked out by ${req.currentUser.fullName}`
      rack.verifiedAt = now;
      rack.save();

      // send a push notification
      if (config.enablePushService) {
        pushNotification({
          ctype:'event',
          origin: config.publicURL,
          event:'rackScanned', 
          id:rack._id, 
          barcode: rack.barcode});
      }

      res.json({message:'OK'});

    } catch (err) {
      console.error(err);
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
      const rack = await ContainerGroup.findOne({barcode: rackBarcode}).exec();

      if (full) {
        const tubes = await Container.find({parentContainer: rack._id}).populate('part').exec();
        const re = JSON.parse(JSON.stringify(rack));
        re.tubes = tubes;
        res.json(re);
      } else {
        const tubes = await Container.find({parentContainer: rack._id}).exec();
        const re = JSON.parse(JSON.stringify(rack));
        re.tubes = tubes;
        res.json(re);
      }
    } catch (err) {
      res.status(404).send(err.message);
    }
  }

  /**
   * get latest verified rack
   */
  app.get('/api/tubeRack/lastVerified', or(beARScanner, beUser), async (req :Request, res: Response, next: NextFunction) => {
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
  app.get('/api/tubeRack/:rackBarcode', or(beUser, beARScanner, beScanner), async (req :Request, res: Response, next: NextFunction) => {
    const {rackBarcode} = req.params;
    const {full} = req.query;
    req.customData = {rackBarcode, full};
    next();
  }, getTubeRack);

  

}