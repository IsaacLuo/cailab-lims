import {Express, Response} from 'express'
import {User, Part, FileData, PartsIdCounter, PartDeletionRequest, PartHistory, LogOperation, PersonalPickList} from '../models'
import {Request} from '../MyRequest'
import {userMustLoggedIn, userCanUseScanner} from '../MyMiddleWare'
import sendBackXlsx from '../sendBackXlsx'
import mongoose from 'mongoose'
import { IPart, IAttachment, IPartForm } from '../types';
const ObjectId = mongoose.Types.ObjectId;

export default function handlePickList(app:Express) {
  /**
   * add items in basket, if id is invalid, create a new basket, if id is 0, use the current newest basket
   */
  app.post('/api/pickList/:id/items/', userMustLoggedIn, async (req :Request, res: Response) => {
    const userId = req.currentUser.id;
    const pickListId = req.params.id;
    let pickList;
    const now = new Date();
    if (pickListId === '0') {
      pickList = await PersonalPickList.findOne().sort('-createdAt').exec();
    } else {
      pickList = await PersonalPickList.findOne({_id: pickListId}).exec();
    }
    if (!pickList) {
        pickList = new PersonalPickList({
          userId,
          createdAt: now,
          parts: [],
        });
      }
    pickList.updatedAt = now;
    const newPickListItemIds = req.body.map(v => ObjectId(v));
    let parts;
    try {
      parts = await Part.find({_id: {$in: req.body}}, '_id  labName personalName').exec();
    } catch (err) {
      res.status(406).json({message:'wrong part ids'});
      return;
    }
    parts = parts.filter(part => pickList.parts.find(v=> v._id.equals(part._id)) ? false : true);
    pickList.parts = [...pickList.parts, ...parts];
    pickList.partsCount = pickList.parts.length;
    await pickList.save();
    res.json(pickList);
  });

  /**
   * get content of a basket
   * @param id the basket id in mongodb,  if id is 0, use the current newest basket 
   */
  app.get('/api/pickList/:id', userCanUseScanner, async (req :Request, res: Response) => {
    const pickListId = req.params.id;
    if (pickListId === '0') {
      try {
        const pickList = await PersonalPickList.findOne().sort('-createdAt').exec();
        res.json(pickList);
      } catch (err) {
        res.status(404).json({message:err.message});
      }
    } else {
      try {
        const pickList = await PersonalPickList.findOne({_id: req.params.id}).exec();
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
      const user = await User.findOne({_id:userId})
      const defaultBasket = user.defaultBasket
      const pickList = await PersonalPickList.find({userId:ObjectId(userId)}, '_id createdAt updatedAt partsCount default name')
      // console.log(user.defaultBasket)
      // console.log(pickList)
      res.json({defaultBasket, pickList});
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
}
