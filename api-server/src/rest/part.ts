import {Express, Response} from 'express'
import {User, Part, FileData, PartsIdCounter, PartDeletionRequest} from '../models'
import {Request} from '../MyRequest'
import {userMustLoggedIn} from '../MyMiddleWare'
import sendBackXlsx from '../sendBackXlsx'
import mongoose from 'mongoose'
import { IPartForm } from '../types';
const ObjectId = mongoose.Types.ObjectId;

export default function handlePart(app:Express) {
  app.post('/api/part', userMustLoggedIn, async (req :Request, res: Response) => {
    // read part form
    let form = req.body;
    // get increased labId
    let {
      sampleType,
      comment,
      date,
      tags,
      markers,
      plasmidName,
      hostStrain,
      parents,
      genotype,
      plasmidType,
      sequence,
      orientation,
      meltingTemperature,
      concentration,
      vendor,
      attachments,
    } = req.body;
  
    try {
      const currentUser = await User.findById(req.currentUser.id).exec();
      const abbr = currentUser.abbr;
      const typeLetter = (t=>{
        switch(t){
          case 'bacterium':
            return 'e';
          case 'primer':
            return 'p';
          case 'yeast':
            return 'y';
          default:
            return 'x';
        }
      })(sampleType);
      const labPrefix = 'YC' + typeLetter;
      const personalPrefix = abbr + typeLetter;
      
      let doc;
    
      doc = await PartsIdCounter.findOneAndUpdate(
        {name:labPrefix},
        {$inc:{count:1}},
        {new: true, upsert: true}
      ).exec();
      const labId = doc.count;
      // get incresed personalId
      doc = await PartsIdCounter.findOneAndUpdate(
        {name:personalPrefix},
        {$inc:{count:1}},
        {new: true, upsert: true}
      ).exec();
      const personalId = doc.count;
      const now = new Date();
  
      // createAttachments
      const attachmentIds = [];
      for(const attachment of attachments) {
        let attContent = attachment.content;
        if (/data:(.*);base64,/.test(attContent)) {
          attContent = attContent.split(',')[1];
        }
        const att = new FileData({
          name: attachment.name,
          data: new Buffer(attContent, 'base64'),
        });
        await att.save();
        attachmentIds.push(
          {
            fileName: attachment.name,
            contentType: attachment.type,
            fileSize: attachment.size,
            fileId: att._id,
          }
        );
      }
  
      console.log('saved attachmes', attachmentIds.length);
  
      // createNewPart
      let part = new Part({
        labName: labPrefix+labId,
        labPrefix,
        labId,
        personalName: personalPrefix+personalId,
        personalPrefix,
        personalId,
        sampleType,
        comment,
        createdAt: now,
        updatedAt: now,
        date,
        tags: tags ? tags.split(';') : [],
        ownerId: currentUser._id,
        ownerName: currentUser.name,
        content: {
          markers: markers ? markers.split(';') : undefined,
          plasmidName,
          hostStrain,
          parents: parents ? parents.split(';') : undefined,
          genotype: genotype ? genotype.split(';') : undefined,
          plasmidType,
          sequence,
          orientation,
          meltingTemperature,
          concentration,
          vendor,
        },
        attachments: attachmentIds,
      });
      await part.save();
      res.json(part);
    } catch (err) {
      console.log(err);
      res.status(500).json({err: err.toString()});
    }
  });
  
  app.get('/api/part/:id', userMustLoggedIn, async (req :Request, res: Response) => {
    const {id} = req.params;
    try {
      let part = await Part.findOne({_id:id}).exec();
      res.json(part);
    } catch (err) {
      res.status(404).send(err.message);
    }
  });
  
  app.put('/api/part/:id', userMustLoggedIn, async (req :Request, res: Response) => {
    const {id} = req.params;
    const form:IPartForm = req.body;
    try {
      const part = await Part.findOne({_id:id}).exec();
      if (part._id.toString() === id && part.ownerId.toString() === req.currentUser.id) {
        part.comment = form.comment;
        part.date = form.date? new Date(form.date) : undefined;
        part.tags = form.tags;
        if (part.sampleType === 'bacterium') {
          part.content.plasmidName = form.plasmidName;
          part.content.hostStrain = form.hostStrain;
          part.content.markers = form.markers;
        } else if(part.sampleType === 'primer') {
          part.content.sequence = form.sequence;
          part.content.orientation = form.orientation;
          part.content.meltingTemperature = form.meltingTemperature;
          part.content.concentration = form.concentration;
          part.content.vendor = form.vendor;
        } else if(part.sampleType === 'yeast') {
          part.content.parents = form.parents;
          part.content.genotype = form.genotype;
          part.content.plasmidType = form.plasmidType;
          part.content.markers = form.markers;
        }
        part.content.customData = form.customData;
        await part.save();
        res.json({message:'OK'});
      } else {
        res.status(401).json({message: 'unable to modify this part'})
      }
    } catch (err) {
      res.status(404).send(err.message);
    }
  });
  
  app.delete('/api/part/:id', userMustLoggedIn, async (req :Request, res: Response) => {
    try {
      const {id} = req.params;
      console.log('delete ', id);
      const part = await Part.findById(id).exec();
      if(!part) {
        await PartDeletionRequest.findOneAndDelete({partId:id}).exec();
        res.status(404).json({message: 'no this part'});
      }
      if (
        part.ownerId.toString() !== req.currentUser.id && 
        req.currentUser.groups.indexOf('administrators')===-1
        ) {
        res.status(401).json({message: 'unable to delete a part of others'});
      } else if (
        Date.now() - part.createdAt.getTime() > 3600000 * 24 * 7 ||
        req.currentUser.groups.indexOf('administrators')===-1
        ) {
        res.status(401).json({message: 'unable to delete a part older than 1 week'});
      } else {
        await Part.findOneAndDelete({_id:id}).exec(); 
        await PartDeletionRequest.findOneAndDelete({partId:id}).exec();
        res.json(part);
      }
    } catch (err) {
      console.error('err', err);
      res.status(500).json({err});
    }
  });

  app.get('/api/parts', userMustLoggedIn, async (req :Request, res: Response) => {
    let {type, skip, limit, user, sortBy, desc, format} = req.query;
    let condition :any = {};
    if (type) {
      condition.sampleType = type;
    }
    if (user) {
      condition.ownerId = ObjectId(user);
    }
    let parts = Part.find(condition)
    if (sortBy) {
      let realSortBy = sortBy;
      if (sortBy === 'personalName') {
        if (desc === 'true') {
          parts = parts.sort({'personalName': -1, 'personalId': -1});
        } else {
          parts = parts.sort({'personalName': 1, 'personalId': 1});
        }
      } else {
        if (sortBy === 'labName') {
            realSortBy = 'labId';
        }
        if (desc === 'true') {
          parts = parts.sort({[realSortBy]: -1});
        } else {
          parts = parts.sort({[realSortBy]: 1});
        }
      }
    } else {
      parts = parts.sort({labId:-1});
    }
    if (skip) parts = parts.skip(parseInt(skip))
    if (limit) parts = parts.limit(parseInt(limit))

    // .select('labName')
    parts.exec((err, data)=>{
      if (err) {
        console.log(err)
        res.status(500).json({err})
      } else {
        switch(format) {
          case 'xlsx':
            sendBackXlsx(res,data);
          break;
          default:
            res.json(data);
        }
      }
    })
  });

  app.get('/api/parts/count', userMustLoggedIn, async (req :Request, res: Response) => {
    let {type, ownerId} = req.query;
    let condition :any = {};
    if (type) {
      condition.sampleType = type;
    }
    if (ownerId) {
      condition.ownerId = ownerId;
    }
    Part.count(condition)
    .exec((err, data)=>{
      if (err) {
        console.log(err)
        res.status(500).json({err})
      } else {
        res.json({count: data});
      }
    })
  });
}

