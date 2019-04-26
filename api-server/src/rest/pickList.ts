import {Express, Response} from 'express'
import {User, Part, UserSchema, FileData, PartsIdCounter, PartDeletionRequest, PartHistory, LogOperation, PersonalPickList, Container} from '../models'
import {Request} from '../MyRequest'
import {or, beUser, beScanner} from '../MyMiddleWare'
import sendBackXlsx from '../sendBackXlsx'
import mongoose from 'mongoose'
import { IPart, IAttachment, IPartForm } from '../types';
const ObjectId = mongoose.Types.ObjectId;

// helper functions

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

export default function handlePickList(app:Express) {
  /**
   * add items in pickList, if id is invalid, use default pickList
   */
  app.post('/api/pickList/:id/items/', or(beUser), async (req :Request, res: Response) => {
    const userId = req.currentUser.id;
    const pickListId = req.params.id;
    let pickList;
    const user = await User.findOne({_id:userId});

    console.log(`add ids ${JSON.stringify(req.body)} to ${pickListId}`);
    
    const now = new Date();
    if (pickListId === '0') {
      pickList = await getDefaultPicklist(user);
    } else {
      pickList = await PersonalPickList.findOne({_id: pickListId}).exec();
    }
    if (!pickList) {
      pickList = await getDefaultPicklist(user);
    }

    pickList.updatedAt = now;
    let parts;
    try {
      parts = await Part.find({_id: {$in: req.body}}, '_id labName personalName').exec();
    } catch (err) {
      res.status(406).json({message:'wrong part ids'});
      return;
    }
    console.log('pickList.parts', pickList.parts, pickList);
    parts = parts.filter(part => pickList.parts.find(v=> v._id.equals(part._id)) ? false : true);
    pickList.parts = [...pickList.parts, ...parts];
    pickList.partsCount = pickList.parts.length;
    await pickList.save();
    res.json(pickList);
  });

  /**
   * get content of a pickList
   * @param id the pickList id in mongodb,  if id is 0, use the default pickList
   * @query full: if set, return full part details, else, return id and names.
   */
  app.get('/api/pickList/:id', or(beUser), async (req :Request, res: Response) => {
    const pickListId = req.params.id;
    const {full} = req.query;
    const user = await User.findOne({_id:req.currentUser.id});
    
    try {
      let pickList;
      if (pickListId === '0') {
        pickList = await getDefaultPicklist(user);
      } else {
        pickList = await PersonalPickList.findOne({_id: pickListId}).exec();
      }
      if(!pickList) {
        throw new Error('');
      }
      if (full) {
        pickList = await PersonalPickList
          .findOne({_id: pickList._id})
          .exec();
        await PersonalPickList.populate(pickList, {path:'parts'})
        await Promise.all(pickList.parts.map(
          v => Part.populate(v, {path:'containers', select:'barcode', model:Container})
        ))
        res.json(pickList);
      } else {
        pickList = await PersonalPickList
          .findOne({_id: pickList._id})
          .exec();
        await PersonalPickList.populate(pickList, {path:'parts', select:'personalName'})
        res.json(pickList);

      }
      
      
    } catch (err) {
      res.status(404).json({message:err.message});
    }
  });

  /**
   * get all pickList and item count of current user
   */
  app.get('/api/pickLists/', or(beUser), async (req :Request, res: Response) => {
    const userId = req.currentUser.id;
    
    try {
      const pickLists = await PersonalPickList.find({owner:ObjectId(userId)}, '_id owner createdAt updatedAt partsCount name').exec();
      console.log(pickLists);
      // if the user does not have a picklist, generate a default one.
      const user = await User.findOne({_id:userId}).exec();
      console.log(user);
      if (pickLists.length === 0) {
        const newPickList = await getDefaultPicklist(user)
        pickLists.push(newPickList);
      }

      if (!user.defaultPickListId || !pickLists.find(v=>v._id.equals(user.defaultPickListId))) {
        user.defaultPickListId = pickLists[0]._id;
        await user.save();
      }
      res.json({defaultPickListId:user.defaultPickListId, pickLists});
    } catch (err) {
      console.error(err);
      res.status(404).json({message:err.message});
    }
  });

  /**
   * delete a pickList
   * @param id the pickList id in mongodb
   */
  app.delete('/api/pickList/:id', or(beUser), async (req :Request, res: Response) => {
    const _id = req.params.id;
    const parts = await PersonalPickList.deleteMany({_id,}).exec();
    res.json(parts);
  });

  /**
   * delete an item in pickList
   * @param id the pickList id in mongodb
   */
  app.delete('/api/pickList/:id/items/:itemId', or(beUser), async (req :Request, res: Response) => {
    const pickListId = ObjectId(req.params.id);
    const itemId = ObjectId(req.params.itemId);
    try {
      const pickList = await PersonalPickList.findOne({_id:pickListId}).exec();
      let parts = pickList.parts;
      pickList.parts = pickList.parts.filter(v => !v._id.equals(itemId))
      pickList.updatedAt = new Date();
      pickList.partsCount = pickList.parts.length;
      await pickList.save();
      await PersonalPickList.populate(pickList, {path:'parts', select:'personalName'});
      res.json(pickList);
    } catch (err) {
      res.status(404).json({message:err.message});
    }
  });

    /**
   * delete all items in pickList
   * @param id the pickList id in mongodb
   */
  app.delete('/api/pickList/:id/items/', or(beUser), async (req :Request, res: Response) => {
    const pickListId = ObjectId(req.params.id);
    const itemId = ObjectId(req.params.itemId);
    try {
      const pickList = await PersonalPickList.findOne({_id:pickListId}).exec();
      pickList.parts = [];
      pickList.updatedAt = new Date();
      pickList.partsCount = pickList.parts.length;
      await pickList.save();
      res.json(pickList);
    } catch (err) {
      res.status(404).json({message:err.message});
    }
  });

  /**
   * set user's default pickList, pickListId in request body.
   */
  app.put('/api/defaultPickListId', or(beUser), async (req :Request, res :Response) => {
    const userId = req.currentUser.id;
    const newPickListId = req.body.pickListId;
    try {
      const user = await User.findOne({_id:userId});
      //verify
      const pickList = await PersonalPickList.findOne({_id:newPickListId, owner:userId}).exec();
      if (!pickList) {
        res.status(404).json({message:'pickList doesn\'t match'});
      } else {
        user.defaultPickListId = pickList._id;
        await user.save();
        res.json({pickListId: pickList._id});
      }
    } catch (err) {
      res.status(404).json({message:err.message});
    }
  });

  /**
   * set new pickList name, pickList name in request body
   * @param id the pickList id in mongodb
   */
  app.post('/api/picklist/:id/name', or(beUser), async (req :Request, res :Response) => {
    const userId = req.currentUser.id;
    const pickListId = req.params.id;
    const newPickListName = req.body.name;

    if (newPickListName === undefined || newPickListName === '') {
      res.status(404).json({message:'pickList can\'t be empty'});
      return;
    }

    try {
      const user = await User.findOne({_id:userId});
      // verify
      const pickList = await PersonalPickList.findOne({_id:pickListId, owner:userId});
      if (!pickList) {
        res.status(404).json({message:'pickList doesn\'t match'});
      } else {
        pickList.name = newPickListName;
        pickList.updatedAt = new Date();
        await pickList.save();
        res.json({pickListName:newPickListName});
      }
    } catch (err) {
      res.status(404).json({message:err.message});
    }
  });

  /**
   * create a new pickList with name
   */
  app.put('/api/pickList/:name', or(beUser), async (req :Request, res: Response) => {
    const userId = req.currentUser.id;
    const pickListName = req.params.name;
    let pickList;
    const now = new Date();  
    pickList = await PersonalPickList.findOne({name: pickListName}).exec();
    if (!pickList) {
      pickList = new PersonalPickList({
        name: pickListName,
        owner: userId,
        createdAt: now,
        updatedAt: now,
        parts: [],
        partsCount: 0,
      });
    await pickList.save();
    res.json(pickList);
    } else {
      res.status(406).json({message:'wrong part ids'});
      return;
    }
  });

  /**
   * get tubes location of parts in a plickList
   */

  app.get('/api/pickList/:id/partLocations', or(beUser, beScanner), async (req :Request, res: Response) => {
    try {
      // const userId = req.currentUser.id;
      const pickListId = req.params.id;
      // const user = await User.findOne({_id:userId});
      // verify
      const pickList = await PersonalPickList.findOne({_id:pickListId}).exec();

      if (!pickList) {
        res.status(404).json({message:'unable to find picklist'});
        return;
      }
      const partIds = pickList.parts.map(v=>v._id);
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
      res.json({parts, partIds,});
    } catch (err) {
      res.status(404).json({message:err.message});
    }
  });

    app.get('/api/pickList/:id/partBarcodes', or(beUser, beScanner), async (req :Request, res: Response) => {
    try {
      // const userId = req.currentUser.id;
      const pickListId = req.params.id;
      // const user = await User.findOne({_id:userId});
      // verify
      const pickList = await PersonalPickList.findOne({_id:pickListId}).exec();

      if (!pickList) {
        res.status(404).json({message:'unable to find picklist'});
        return;
      }
      const partIds = pickList.parts.map(v=>v._id);
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
      res.json({parts, partIds,});
    } catch (err) {
      res.status(404).json({message:err.message});
    }
  });

}
