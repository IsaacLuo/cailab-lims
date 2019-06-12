import { 
  Ctx,
  Next,
  ILocation,
} from '../types';

import { 
  Container,
  Location,
  ContainerGroup,
  IContainerGroupModel,
  IContainerModel,
  LogOperation,
  LocationHistory,
} from './../models';

import koa from 'koa';
import Router from 'koa-router';
import {userMust, beAdmin, beUser, beScanner} from '../identifyUsers'
import { Model, Document } from 'mongoose';

/**
 * handles the CURD of containers
 * GET /api/containers
 */
export default function handleLocations (app:koa, router:Router) {
  /**
   * put a tube or rack into location
   */
  router.put(
    '/api/location/:locationBarcode/content/:objectBarcode',
    userMust(beUser, beScanner),
    async (ctx:Ctx, next:Next) => {
      const {locationBarcode, objectBarcode} = ctx.params;
      // find location
      let location = await Location.findOne({barcode: locationBarcode}).exec();
      if (!location) {
        location = await Location.create({
          barcode: locationBarcode,
          description: 'unknown location'
        });
      }

      // assume this barcode belongs to a rack or plate
      let object:IContainerGroupModel|IContainerModel = await ContainerGroup.findOne({barcode: objectBarcode}).populate('location').exec();
      if (!object) {
        // not a rack, assume it is a tube
        object = await Container.findOne({barcode:objectBarcode}).populate('location').exec();
      }

      if (!object) {
        throw new Error('the object is neither rack nor tube');
      }

      const now = new Date();
      const originalLocation:ILocation = object.location as ILocation;
      // put object into location
      object.location = location._id;
      object.locationHistory.push({location:location._id, verifiedAt: now});
      await (object as Document).save();

      LocationHistory.create({
        containerBarcode: objectBarcode,
        locationBarcode,
      });

      // =============log================
      LogOperation.create({
        operator: ctx.state.user._id,
        operatorName: ctx.state.user.name,
        type: `move ${object.ctype} to new location`,
        level: 2,
        sourceIP: ctx.request.ip,
        timeStamp: now,
        data: {
          object,
          originalLocation: originalLocation,
          newLocation: location,
        },
      });
      // ===========log end=============

      ctx.body = {message:'OK'};
    }
  );

  /**
   * find some thing in the location
   */
  router.get(
    '/api/location/:locationBarcode', 
    userMust(beScanner, beUser), 
    async (ctx:Ctx, next:Next) => {
      const {locationBarcode} = ctx.params;
      // find location
      let location = await Location.findOne({barcode: locationBarcode}).exec();
      if (!location) {
        throw new Error('no such location');
      }
      let racks = await ContainerGroup.find({location: location._id}).exec();
      let tubes = await Container.find({location: location._id}).exec();

      const now = new Date();
      ctx.body = {message:'OK', racks, tubes};

  });

}