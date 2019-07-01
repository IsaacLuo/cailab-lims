import { 
  Ctx,
  Next,
} from '../types';

import { 
  Container, Part, ContainerGroup, RackScannerRecord,
} from './../models';

import koa from 'koa';
import Router from 'koa-router';
import {userMust, beAdmin, beUser, beScanner, beRackScanner} from '../identifyUsers'

/**
 * handles the CURD of containers
 * GET /api/containers
 */
export default function handleTubeRacks (app:koa, router:Router) {
  /**
   * update a rack
   */
  router.put(
    '/api/tubeRack/:rackBarcode',
    userMust(beUser, beRackScanner),
    async (ctx:Ctx, next:Next) => {
      console.log('pub tube rack');
      const {rackBarcode} = ctx.params;
      const tubeBarcodes = ctx.request.body.tubes.map(v=>v.barcode);
      try {
        const now = new Date();
        // get rack container
        let rack = await ContainerGroup.findOne({
          ctype: 'rack',
          barcode: rackBarcode,
        }).exec();
        if (!rack) {
          ctx.state.logger.debug('no rack, create one')
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
      ).exec();
      // console.debug(result)

      // save tubes
      const promises = ctx.request.body.tubes.map(v=> Container.updateMany(
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
      record.tubes = ctx.request.body.tubes.map(v => ({
        wellName: v.location,
        wellId: v.locationIndex,
        barcode: v.barcode,
      }));

      promises.push(record.save());

      await Promise.all(promises);

      // rack is on scanner
      // rack.currentStatus = `checked out by ${ctx.state.user._id}`
      // rack.verifiedAt = now;
      // rack.save();

      // send a push notification
      // if (config.enablePushService) {
      //   pushNotification({
      //     ctype:'event',
      //     origin: config.publicURL,
      //     eventType:'rackScanned', 
      //     id:rack._id, 
      //     barcode: rack.barcode});
      // }

      ctx.body = {message:'OK'};

    } catch (err) {
      ctx.state.logger.error(err.message);
      if (ctx.status < 300) {
        ctx.status = 406;
      }
      throw(err);
    }
  });

  /**
   * get a tube rack data from given rackBarcode and full
   * @param ctx.state.data.rackBarcode string, the barcode of the rack
   * @param ctx.state.data.full boolean, true: show all details of the tubes, false, hide details of tubes
   */
  async function getTubeRack(ctx:Ctx) {
    const {rackBarcode, full} = ctx.state.data;
    const rack = await ContainerGroup.findOne({barcode: rackBarcode}).exec();
    if(!rack) {
      ctx.throw(404, 'no such a rack');
    }
    if (full) {
      const tubes = await Container.find({parentContainer: rack._id}).populate('part').exec();
      const re = JSON.parse(JSON.stringify(rack));
      re.tubes = tubes;
      ctx.body = re;
    } else {
      const tubes = await Container.find({parentContainer: rack._id}).exec();
      const re = JSON.parse(JSON.stringify(rack));
      re.tubes = tubes;
      ctx.body = re;
    }
  }

  /**
   * get latest verified rack
   */
  router.get(
    '/api/tubeRack/lastVerified',
    userMust(beUser),
    async (ctx:Ctx, next:Next) => {
      const {full} = ctx.query;
      const rack = await RackScannerRecord.find({}).select('rackBarcode').sort({createdAt:-1}).limit(1).exec();
      if(rack.length === 0) {
        ctx.throw(404, 'no record');
        return;
      }
      const rackBarcode = rack[0].rackBarcode;
      ctx.state.data = {rackBarcode, full};
      await next();
  }, getTubeRack);

  /**
   * get a rack
   */
  router.get(
    '/api/tubeRack/:rackBarcode',
    userMust(beUser, beScanner),
    async (ctx:Ctx, next:Next) => {
      const {rackBarcode} = ctx.params;
      const {full} = ctx.query;
      ctx.state.data = {rackBarcode, full};
      await next();
  }, getTubeRack);


}