import {Express, Response} from 'express'
import {User, Part, UserSchema, FileData, PartsIdCounter, PartDeletionRequest, PartHistory, LogOperation, PersonalPickList} from '../models'
import {Request} from '../MyRequest'
import {userMustLoggedIn, userCanUseScanner} from '../MyMiddleWare'
import sendBackXlsx from '../sendBackXlsx'
import mongoose from 'mongoose'
import { IPart, IAttachment, IPartForm } from '../types';
const ObjectId = mongoose.Types.ObjectId;

// helper functions

/**
 * get the default baseket of user, if there is not a basket, create a default one.
 * @param user the user model
 */
async function getDefaultPicklist(user:any) {
  try {
    if (user.defaultBasket) {
      const pickList = await PersonalPickList.findOne({_id:user.defaultBasket}).exec();
      if(pickList) {
        return pickList;
      } else {
        throw new Error('no default basket');
      }
    } else {
      throw new Error('no default basket');
    }
  } catch (err) {
    if (err.message === 'no default basket') {
      console.warn('user does not have default basket');
      let pickList = await PersonalPickList.findOne().sort('-createdAt').exec();
      if(!pickList) {
        pickList = new PersonalPickList({
        userId: user._id,
        createdAt: new Date(),
        parts: [],
        name: 'default',
        partsCount: 0,
        });
        await pickList.save();
      }
      user.defaultBasket = pickList._id;
      await user.save();
      return pickList;
    }
  }
}

export default function handlePickList(app:Express) {
  /**
   * add items in basket, if id is invalid, use default basket
   */
  app.post('/api/pickList/:id/items/', userMustLoggedIn, async (req :Request, res: Response) => {
    const userId = req.currentUser.id;
    const pickListId = req.params.id;
    let pickList;
    const user = await User.findOne({_id:userId});
    
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
      parts = await Part.find({_id: {$in: req.body}}, '_id  labName personalName').exec();
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
   * get content of a basket
   * @param id the basket id in mongodb,  if id is 0, use the default basket
   */
  app.get('/api/pickList/:id', userCanUseScanner, async (req :Request, res: Response) => {
    const pickListId = req.params.id;
    const user = await User.findOne({_id:req.currentUser.id});

    if (pickListId === '0') {
      try {
        const pickList = await getDefaultPicklist(user);
        res.json(pickList);
      } catch (err) {
        res.status(404).json({message:err.message});
      }
    } else {
      try {
        const pickList = await PersonalPickList.findOne({_id: pickListId}).exec();
        res.json(pickList);
      } catch (err) {
        res.status(404).json({message:err.message});
      }
    }
  });

  /**
   * get all basket and item count of current user
   */
  app.get('/api/pickLists/', userCanUseScanner, async (req :Request, res: Response) => {
    const userId = req.currentUser.id;
    try {
      const pickList = await PersonalPickList.find({userId:ObjectId(userId)}, '_id createdAt updatedAt partsCount name').exec();
      // if the user does not have a picklist, generate a default one.
      const user = await User.findOne({_id:userId}).exec();
      if (pickList.length === 0) {
        const newPickList = await getDefaultPicklist(user)
        pickList.push(newPickList);
      }

      if (!user.defaultBasket || !pickList.find(v=>v._id === user.defaultBasket)) {
        user.defaultBasket = pickList[0]._id;
        user.save();
      }
      res.json({defaultBasket:user.defaultBasket, pickList});
    } catch (err) {
      res.status(404).json({message:err.message});
    }
  });

  /**
   * delete a basket
   * @param id the basket id in mongodb
   */
  app.delete('/api/pickList/:id', userMustLoggedIn, async (req :Request, res: Response) => {
    const _id = req.params.id;
    const parts = await PersonalPickList.deleteMany({_id,}).exec();
    res.json(parts);
  });

  /**
   * delete an item in basket
   * @param id the basket id in mongodb
   */
  app.delete('/api/pickList/:id/items/:itemId', userMustLoggedIn, async (req :Request, res: Response) => {
    const pickListId = ObjectId(req.params.id);
    const itemId = ObjectId(req.params.itemId);
    try {
      const pickList = await PersonalPickList.findOne({_id:pickListId}).exec();
      let parts = pickList.parts;
      pickList.parts = pickList.parts.filter(v => !v._id.equals(itemId))
      pickList.updatedAt = new Date();
      pickList.partsCount = pickList.parts.length;
      await pickList.save();
      res.json(pickList);
    } catch (err) {
      res.status(404).json({message:err.message});
    }
  });

    /**
   * delete all items in basket
   * @param id the basket id in mongodb
   */
  app.delete('/api/pickList/:id/items/', userMustLoggedIn, async (req :Request, res: Response) => {
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
   * set user's default basket, basketId in request body.
   */
  app.put('/api/defaultBasket', userMustLoggedIn, async (req :Request, res :Response) => {
    const userId = req.currentUser.id;
    const newBasketId = req.body.basketId;
    try {
      const user = await User.findOne({_id:userId});
      //verify
      const basket = await PersonalPickList.findOne({_id:newBasketId, userId});
      if (!basket) {
        res.status(404).json({message:'basket doesn\'t match'});
      } else {
        user.defaultBasket = newBasketId;
        await user.save();
        res.json({basketId:newBasketId});
      }
    } catch (err) {
      res.status(404).json({message:err.message});
    }
  });

  /**
   * set new basket name, basket name in request body
   * @param id the basket id in mongodb
   */
  app.post('/api/picklist/:id/basketName', userMustLoggedIn, async (req :Request, res :Response) => {
    const userId = req.currentUser.id;
    const basketId = req.params.id;
    const newBasketName = req.body.basketName;

    if (newBasketName === undefined || newBasketName === '') {
      res.status(404).json({message:'basket can\'t be empty'});
      return;
    }

    try {
      const user = await User.findOne({_id:userId});
      // verify
      const basket = await PersonalPickList.findOne({_id:basketId, userId});
      if (!basket) {
        res.status(404).json({message:'basket doesn\'t match'});
      } else {
        basket.name = newBasketName;
        basket.updatedAt = new Date();
        await basket.save();
        res.json({basketName:newBasketName});
      }
    } catch (err) {
      res.status(404).json({message:err.message});
    }
  });

  /**
   * create a new basket with name
   */
  app.put('/api/pickList/:name', userMustLoggedIn, async (req :Request, res: Response) => {
    const userId = req.currentUser.id;
    const pickListName = req.params.name;
    let pickList;
    const now = new Date();  
    pickList = await PersonalPickList.findOne({name: pickListName}).exec();
    if (!pickList) {
      pickList = new PersonalPickList({
        name: pickListName,
        userId,
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

}
