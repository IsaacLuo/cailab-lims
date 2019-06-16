import { 
  Ctx,
  Next,
} from '../types';

import { 
  Container, Part,
} from './../models';

import koa from 'koa';
import Router from 'koa-router';
import {userMust, beAdmin, beUser, beScanner} from '../identifyUsers'

/**
 * handles the CURD of containers
 * GET /api/containers
 */
export default function handleTubes (app:koa, router:Router) {
  /**
   * get a tube
   */
  router.get(
    '/api/tubes/',
    userMust(beUser, beScanner),
    async (ctx:Ctx, next:Next) => {
      let containers = await Container.find({ctype:'tube'}).exec();
      let totalCount = await Container.countDocuments({ctype:'tube'}).exec();
      ctx.body = ({containers, totalCount});
    }
  );

  /**
   * get a tube and its content
   */
  router.get(
    '/api/tube/:barcode/content',
    userMust(beUser, beScanner),
    async (ctx:Ctx, next:Next) => {
      const {barcode} = ctx.params;
      let tube = await Container.findOne({barcode,}).populate('part').exec();
      if (!tube) ctx.throw(404, 'tube not found');
      ctx.body = tube;
  });

  /**
   * delete a tube
   * search in all parts, then delete it, a tube should only belongs a part.
   * this will remove barcode by force, so only admin can call this API, normal user 
   * should call DELETE /api/part/:partId/tube/:tubeId to delete a tube
   * @param id, the tube barcode
   */
  router.delete(
    '/api/tube/:barcode',
    userMust(beAdmin),
    async (ctx:Ctx, next:Next) => {
      const {barcode} = ctx.params;
      const containers = await Container.find({ctype:'tube', barcode}).exec(); //array, but there should be only one
      for(let i=0;i<containers.length;i++) {
        const container = containers[i];
        const relatedPartId = container.part;
        let part = await Part.findById(relatedPartId).exec();
        part.containers = part.containers.filter(v=>v.toString() !== container._id.toString());
        await part.save();
        let parts = await Part.find({containers: container._id});
        if(parts.length>0) {
          ctx.state.logger.warn('the part.container is not match container.part');
        }
        for (let j=0;j<parts.length;j++) {
          part = parts[j];
          part.containers = part.containers.filter(v=>v.toString() !== container._id.toString());
          await part.save();
        }
      };
      

      
    // try {

    //   // let part = await Part.findOne({'containers.ctype':'tube', 'containers.barcode':barcode}).exec();
    //   if (!part) ctx.throw(404, 'tube not found');

    //   part.containers = part.containers.filter(v=> !(v.ctype === 'tube' && v.barcode === barcode));
    //   await part.save();
    //   ctx.body = part;
    // } catch (err) {
    //   ctx.throw(404, err.message);
    // }
  });

  /**
   * get a batch of tubes
   */
  router.post(
    '/api/tubes/queries',
    userMust(beUser, beScanner),
    async (ctx:Ctx, next:Next) => {
    try {
      const {query} = ctx.request.body;
      const populates = [
        {path:'operator', select:'name'},
        {path:'part', select:'personalName'},
        {path:'parentContainer', select:['barcode', 'location'], populate:{path:'location'}},
        'location',
      ];
      let q = Container.find(query);
      populates.forEach(populate => {
        q = q.populate(populate);
      });
      const tubes = await q.exec();
      ctx.body = (tubes);
    } catch (err) {
      console.error(err);
      ctx.throw(500, {message:err.message});
    }
  });

}