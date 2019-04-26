import { ContainerGroup, LogOperation, LocationHistory } from './../models';
import {Express, Response} from 'express'
import {
  Location,
  User,
  Part,
  Container,
  } from '../models'
import {Request} from '../MyRequest'
import {or, beUser, beScanner,} from '../MyMiddleWare'
import sendBackXlsx from '../sendBackXlsx'
import mongoose from 'mongoose'
import { IPart, IAttachment, IPartForm } from '../types';
import { json } from 'body-parser';
const ObjectId = mongoose.Types.ObjectId;

export default function handleLocation(app:Express) {

  /**
   * put a tube or rack into location
   */
  app.put('/api/location/:locationBarcode/content/:objectBarcode', or(beScanner, beUser), async (req :Request, res: Response) => {
    const {locationBarcode, objectBarcode} = req.params;
    try {
      // find location
      let location = await Location.findOne({barcode: locationBarcode}).exec();
      if (!location) {
        location = await Location.create({
          barcode: locationBarcode,
          description: 'unknown location'
          });
      }

      // assume this barcode belongs to a rack or plate
      let object = await ContainerGroup.findOne({barcode: objectBarcode}).populate('location').exec();
      if (!object) {
        // not a rack, assume it is a tube
        object = await Container.findOne({barcode:objectBarcode}).populate('location').exec();
      }

      if (!object) {
        throw new Error('the object is neither rack nor tube');
      }

      const now = new Date();

      // =============log================
      LogOperation.create({
        operator: req.currentUser.id,
        operatorName: req.currentUser.fullName,
        type: `move ${object.ctype} to new location`,
        level: 2,
        sourceIP: req.ip,
        timeStamp: now,
        data: {
          object,
          originalLocation: object.location && object.location.description,
          newLocation: location.description,
        },
      });
      // ===========log end=============


      // put object into location
      object.location = location;
      object.locationHistory.push({location, verifiedAt: now});
      await object.save();

      LocationHistory.create({
        containerBarcode: objectBarcode,
        locationBarcode,
      })

      res.json({message:'OK'});

    } catch (err) {
      res.status(404).send(err.message);
    }
  });

  /**
   * find some thing in the location
   */
  app.get('/api/location/:locationBarcode', or(beScanner, beUser), async (req :Request, res: Response) => {
    const {locationBarcode} = req.params;
    try {
      // find location
      let location = await Location.findOne({barcode: locationBarcode}).exec();
      if (!location) {
        throw new Error('no such location');
      }

      let racks = await ContainerGroup.find({location: location._id}).exec();
      let tubes = await Container.find({location: location._id}).exec();

      const now = new Date();

      res.json({message:'OK', racks, tubes});

    } catch (err) {
      res.status(404).send(err.message);
    }
  });
}