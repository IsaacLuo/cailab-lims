import { 
  Ctx,
  Next,
} from '../types';

import { 
  User,
  Container, 
  PersonalPickList,
  Part,
} from './../models';

import koa from 'koa';
import Router from 'koa-router';
import {userMust, beAdmin, beUser, beScanner} from '../identifyUsers'

/**
 * get the default baseket of user, if there is not a pickList, create a default one.
 * @param user the user model
 */
async function getDefaultPicklist(user:any) {
  try {
    if (user.defaultPickListId) {
      const pickList = await PersonalPickList.findOne({_id:user.defaultPickListId, owner:user._id}).exec();
      if(pickList) {
        return pickList;
      } else {
        throw new Error('no default pickList');
      }
    } else {
      throw new Error('no default pickList');
    }
  } catch (err) {
    if (err.message === 'no default pickList') {
      console.warn(`user ${user.name} does not have default pickList`);
      let pickList = await PersonalPickList.findOne({owner:user._id}).sort('-createdAt').exec();
      const now = new Date();
      if(!pickList) {
        pickList = new PersonalPickList({
        name: 'default',
        owner: user._id,
        createdAt: now,
        updatedAt: now,
        parts: [],
        partsCount: 0,
        });
        await pickList.save();
      }
      user.defaultPickListId = pickList._id;
      await user.save();
      return pickList;
    }
  }
}

/**
 * handles the CURD of containers
 * GET /api/containers
 */
export default function handlePicklists (app:koa, router:Router) {
  /**
   * add items in pickList, if id is invalid, use default pickList
   */
  router.post(
    '/api/pickList/:id/items/',
    userMust(beUser),
    async (ctx:Ctx, next:Next) => {
      const pickListId = ctx.params.id;
      const user = await User.findById(ctx.state.user._id);
      let pickList;
      ctx.state.logger.info(`add ids ${JSON.stringify(ctx.request.body)} to ${pickListId}`);
      
      const now = new Date();
      if (pickListId === '0') {
        pickList = await getDefaultPicklist(user);
      } else {
        pickList = await PersonalPickList.findById(pickListId).exec();
      }
      if (!pickList) {
        pickList = await getDefaultPicklist(user);
      }
      pickList.updatedAt = now;
      let parts;
      try {
        parts = await Part.find({_id: {$in: ctx.request.body}}, '_id labName personalName').exec();
      } catch (err) {
        ctx.throw(406, {message:'wrong part ids'});
        return;
      }
      console.log('pickList.parts', pickList.parts, pickList);
      parts = parts.filter(part => pickList.parts.find(v=> v._id.equals(part._id)) ? false : true);
      pickList.parts = [...pickList.parts, ...parts];
      pickList.partsCount = pickList.parts.length;
      await pickList.save();
      ctx.body = pickList;
    }
  );

  /**
   * get content of a pickList
   * @param id the pickList id in mongodb,  if id is 0, use the default pickList
   * @query full: if set, return full part details, else, return id and names.
   */
  router.get(
    '/api/pickList/:id',
    userMust(beUser),
    async (ctx:Ctx, next:Next) => {
      const pickListId = ctx.params.id;
      const {full} = ctx.query;

      const user = await User.findById(ctx.state.user._id).exec();
      let pickList;
      if (pickListId === '0') {
        pickList = await getDefaultPicklist(user);
      } else {
        pickList = await PersonalPickList.findOne({_id: pickListId}).exec();
      }
      if(!pickList) {
        ctx.throw(404);
      }
      if (full) {
        pickList = await PersonalPickList
          .findOne({_id: pickList._id})
          .populate({
            path:'parts',
            populate:  {
              path:'containers'
            }
          })
          .exec();
        ctx.body = pickList;
      } else {
        pickList = await PersonalPickList
          .findOne({_id: pickList._id})
          .exec();
        await PersonalPickList.populate(pickList, {path:'parts', select:'personalName'})
        ctx.body = pickList;
      }
    }
  );

  router.get(
    '/api/pickLists/',
    userMust(beUser),
    async (ctx:Ctx, next:Next) => {
      const pickLists = await PersonalPickList.find(
        {owner:ctx.state.user._id}, 
        '_id owner createdAt updatedAt partsCount name')
        .exec();
      console.log(pickLists);
      // if the user does not have a picklist, generate a default one.
      const user = await User.findById(ctx.state.user._id).exec();
      console.log(user);
      if (pickLists.length === 0) {
        const newPickList = await getDefaultPicklist(user)
        pickLists.push(newPickList);
      }

      if (!user.defaultPickList || !pickLists.find(v=>v._id.equals(user.defaultPickList))) {
        user.defaultPickList = pickLists[0]._id;
        await user.save();
      }
      ctx.body = {defaultPickList:user.defaultPickList, pickLists};
    }
  );

  /**
   * delete a pickList
   * @param id the pickList id in mongodb
   */
  router.delete(
    '/api/pickList/:id',
    userMust(beUser),
    async (ctx:Ctx, next:Next) => {
      const _id = ctx.params.id;
      const parts = await PersonalPickList.deleteMany({_id,}).exec();
      ctx.body = parts;
    }
  );

  /**
   * delete an item in pickList
   * @param id the pickList id in mongodb
   */
  router.delete(
    '/api/pickList/:id/items/:itemId',
    userMust(beUser),
    async (ctx:Ctx, next:Next) => {
      const pickListId = ctx.params.id;
      const itemId = ctx.params.itemId;
      const pickList = await PersonalPickList.findById(pickListId).exec();
      if (!pickList) {
        ctx.throw(404);
      }
      pickList.parts = pickList.parts.filter(v => v.toString()!==itemId);
      pickList.updatedAt = new Date();
      pickList.partsCount = pickList.parts.length;
      await pickList.save();
      await PersonalPickList.populate(pickList, {path:'parts', select:'personalName'});
      ctx.body = (pickList);
    }
  );
  
  /**
   * delete all items in pickList
   * @param id the pickList id in mongodb
   */
  router.delete(
    '/api/pickList/:id/items/',
    userMust(beUser),
    async (ctx:Ctx, next:Next) => {
      const pickListId = ctx.params.id;
      const pickList = await PersonalPickList.findById(pickListId).exec();
      pickList.parts = [];
      pickList.updatedAt = new Date();
      pickList.partsCount = pickList.parts.length;
      await pickList.save();
      ctx.body = pickList;
    }
  );

  /**
   * set user's default pickList, pickListId in request body.
   */
  router.put(
    '/api/defaultPickListId',
    userMust(beUser),
    async (ctx:Ctx, next:Next) => {
      const newPickListId = ctx.request.body.pickListId;
      
        const user = await User.findById(ctx.state.user._id).exec();
        //verify
        const pickList = await PersonalPickList.findOne({_id:newPickListId, owner:user._id}).exec();
        if (!pickList) {
          ctx.throw(404, {message:'pickList doesn\'t match'});
        }
        user.defaultPickList = pickList._id;
        await user.save();
        ctx.body = {pickList: pickList._id};
  });

  /**
   * set new pickList name, pickList name in request body
   * @param id the pickList id in mongodb
   */
  router.put(
    '/api/picklist/:id/name',
    userMust(beUser),
    async (ctx:Ctx, next:Next) => {
    const pickListId = ctx.params.id;
    const newPickListName = ctx.request.body.name;

    if (newPickListName === undefined || newPickListName === '') {
      ctx.throw(404,{message:'pickList can\'t be empty'});
      return;
    }
    // const user = await User.findById(ctx.state.user._id);
    // verify
    const pickList = await PersonalPickList.findOne({_id:pickListId, owner:ctx.state.user._id}).exec();
    if (!pickList) {
      ctx.throw(404, {message:'pickList doesn\'t match'});
    }
    pickList.name = newPickListName;
    pickList.updatedAt = new Date();
    await pickList.save();
    ctx.body = {pickListName:newPickListName};
  });

  /**
   * create a new pickList with name
   */
  router.post(
    '/api/pickList/:name',
    userMust(beUser),
    async (ctx:Ctx, next:Next) => {
      const pickListName = ctx.params.name;
      let pickList;
      const now = new Date();  
      pickList = await PersonalPickList.findOne({name: pickListName}).exec();
      if (!pickList) {
        pickList = new PersonalPickList({
          name: pickListName,
          owner: ctx.state.user._id,
          createdAt: now,
          updatedAt: now,
          parts: [],
          partsCount: 0,
        });
        await pickList.save();
        ctx.body = pickList;
      } else {
        ctx.throw(406, {message:'wrong part ids'});
      }
  });

  /**
   * get tubes location of parts in a plickList
   */
  router.get(
    '/api/pickList/:id/partLocations',
    userMust(beUser, beScanner),
    async (ctx:Ctx, next:Next) => {
      // const userId = req.currentUser.id;
      const pickListId = ctx.params.id;
      let pickList;
      if (pickListId === '0') {
        const user = await User.findById(ctx.state.user).exec();
        pickList = await getDefaultPicklist(user);
      } else {
        pickList = await PersonalPickList.findById(pickListId).exec();
      }
      // const user = await User.findOne({_id:userId});
      // verify
      

      if (!pickList) {
        ctx.state.logger.error('no picklist');
        ctx.throw(404, {message:'unable to find picklist'});
      }
      const partIds = pickList.parts;
      const parts = await Part
        .find({_id:partIds}, 'personalName containers')
        .populate({
          path: 'containers',
          select: 'ctype assignedAt parentContainer location wellName currentStatus barcode',
          populate : {
            path: 'parentContainer',
            select: 'ctype barcode location currentStatus',
            populate: {
              path: 'location',
            }
          }
        })
        .exec();
      ctx.body = {parts, partIds,};
  });

  router.get(
    '/api/pickList/:id/partBarcodes',
    userMust(beUser, beScanner),
    async (ctx:Ctx, next:Next) => {
      // const userId = req.currentUser.id;
      const pickListId = ctx.params.id;
      // const user = await User.findOne({_id:userId});
      // verify
      const pickList = await PersonalPickList.findOne({_id:pickListId}).exec();

      if (!pickList) {
        ctx.throw(404, {message:'unable to find picklist'});
        return;
      }
      const partIds = pickList.parts;
      const parts = await Part
        .find({_id:partIds}, 'personalName containers')
        .populate({
          path: 'containers',
          select: 'ctype assignedAt parentContainer wellName currentStatus barcode',
          populate : {
            path: 'parentContainer',
            select: 'ctype barcode currentStatus',
          }
        })
        .exec();
      ctx.body = {parts, partIds,};
  });

}
