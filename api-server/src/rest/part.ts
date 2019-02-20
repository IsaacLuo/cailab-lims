import { SET_CURRENT_BASKET } from './../../../frontend/src/pages/BasketList/actions';
import {Express, Response} from 'express'
import {User, Part, FileData, PartsIdCounter, PartDeletionRequest, PartHistory, LogOperation, Container} from '../models'
import {Request} from '../MyRequest'
import {userMustLoggedIn,userCanUseScanner} from '../MyMiddleWare'
import sendBackXlsx from '../sendBackXlsx'
import mongoose from 'mongoose'
import { IPart, IAttachment, IPartForm } from '../types';
import { json } from 'body-parser';
import config from '../config';
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
      customData,
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
          size: attachment.size,
          contentType: attachment.type,
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
  
      req.log.info('saved attachmes', attachmentIds.length);
  
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
          customData: customData,
        },
        attachments: attachmentIds,
      });
      await part.save();
      // =============log================
      LogOperation.create({
        operatorId: req.currentUser.id,
        operatorName: req.currentUser.fullName,
        type: 'create part',
        level: 3,
        sourceIP: req.ip,
        timeStamp: new Date(),
        data: { part },
      });
      // ===========log end=============
      res.json(part);
    } catch (err) {
      req.log.error(err);
      res.status(500).json({err: err.toString()});
    }
  });
  
  app.get('/api/part/:id', userCanUseScanner, async (req :Request, res: Response) => {
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
      // user must own this part
      if (part._id.toString() === id && part.ownerId.toString() === req.currentUser.id) {
        // ===============save history before change=============
        let partHistory = await PartHistory.findOne({partId: part._id}).exec();
        if (!partHistory) partHistory = new PartHistory({partId: part._id, histories:[] });
        partHistory.histories.push(part);
        await partHistory.save();
        // ===============end saving hisoty======================

        // now save the part
        part.history = partHistory._id;
        part.comment = form.comment;
        part.date = form.date? new Date(form.date) : undefined;
        part.tags = form.tags;
        part.updatedAt = new Date();
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

        // handling attachments
        try {
          // const originalAttachments = part.attachments;
          const newAttachments:IAttachment[] = [];
          for (const attachment of form.attachments) {
            if(attachment.fileId) {
              // there is a file Id, check if the file Id exist then add it.
              const fileData = await FileData.findOne({_id:attachment.fileId});
              newAttachments.push({
                fileId: fileData._id,
                fileName: fileData.name,
                contentType: fileData.contentType,
                fileSize: fileData.size,
              })
            } else if(attachment.content && 
                      attachment.fileName && 
                      attachment.contentType && 
                      attachment.fileSize) {
                let attContent = attachment.content;
                if (/data:(.*);base64,/.test(attContent)) {
                  attContent = attContent.split(',')[1];
                }
              const fileData = new FileData({
                name: attachment.fileName,
                data: new Buffer(attContent, 'base64'),
                size: attachment.fileSize,
                contentType: attachment.contentType,
              });
              await fileData.save();
              newAttachments.push({
                fileId: fileData._id,
                fileName: fileData.name,
                contentType: fileData.contentType,
                fileSize: fileData.size,
              });
            } else {
              throw new Error('incorrect attachmentformat');
            }
          }
          part.attachments = newAttachments;
        } catch(err) {
          req.log.error(err);
          res.status(401).json({message: 'unable to modify this part', err: err.message});
          return;
        }
        await part.save();
        res.json({message:'OK'});
        // =============log================
        LogOperation.create({
          operatorId: req.currentUser.id,
          operatorName: req.currentUser.fullName,
          type: 'update part',
          level: 4,
          sourceIP: req.ip,
          timeStamp: new Date(),
          data: { part },
        });
        // ===========log end=============
      } else {
        res.status(401).json({message: 'unable to modify this part'})
      }
    } catch (err) {
      req.log.error(err);
      res.status(404).send(err.message);
    }
  });
  
  app.delete('/api/part/:id', userMustLoggedIn, async (req :Request, res: Response) => {
    try {
      const {id} = req.params;
      req.log.info(`${req.ip} delete part ${id}`);
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
        Date.now() - part.createdAt.getTime() > 3600000 * 24 * 7 &&
        req.currentUser.groups.indexOf('administrators')===-1
        ) {
        res.status(401).json({message: 'unable to delete a part older than 1 week'});
      } else {
        // ===============save history before change=============
        let partHistory = await PartHistory.findOne({partId: part._id}).exec();
        if (!partHistory) partHistory = new PartHistory({partId: part._id, histories:[] });
        partHistory.histories.push(part);
        await partHistory.save();
        // ===============end saving hisoty======================
        await Part.findOneAndDelete({_id:id}).exec(); 
        await PartDeletionRequest.findOneAndDelete({partId:id}).exec();
        res.json(part);

        // =============log================
        LogOperation.create({
          operatorId: req.currentUser.id,
          operatorName: req.currentUser.fullName,
          type: 'delete part',
          level: 4,
          sourceIP: req.ip,
          timeStamp: new Date(),
          data: { part },
        });
        // ===========log end=============
      }
    } catch (err) {
      console.error('err', err);
      res.status(500).json({err});
    }
  });

  app.get('/api/parts', userMustLoggedIn, async (req :Request, res: Response) => {
    let {search, type, skip, limit, user, sortBy, desc, format} = req.query;
    let condition :any = {};
    if (search) {
      condition.$text = {$search:search};
    }
    if (type) {
      condition.sampleType = type;
    }
    if (user) {
      condition.ownerId = ObjectId(user);
    }
    let parts = Part.find(condition);
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

    // get count of all
    let totalCount = await Part.count(condition).exec();

    // .select('labName')
    parts.exec((err, data)=>{
      if (err) {
        req.log.error(err);
        res.status(500).json({message:err.message});
      } else {
        switch(format) {
          case 'xlsx':
            sendBackXlsx(res,data);
          break;
          default:
            res.json({
              filter: {type, skip, limit, user, sortBy, order: desc ? 'desc': 'asc'},
              totalCount, 
              parts: data,
              });
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
    Part.countDocuments(condition)
    .exec((err, data)=>{
      if (err) {
        req.log.error(err)
        res.status(500).json({err})
      } else {
        res.json({count: data});
      }
    })
  });

  /**
   * assgin a tube to a part
   */
  app.put('/api/part/:id/tube/:barcode', userCanUseScanner, async (req :Request, res: Response) => {
    const {id, barcode} = req.params;
    try {
      const part = await Part.findOne({_id:id}).exec();
      if(!part) {
        res.status(404).json({message:`unable to find part ${id}`});
        return;
      }
      // try to find a tube with given barcode
      let container = await Container.findOne({barcode}).exec();
      if(container && container.currentStatus !== 'empty') {
        if (container.part && container.part.toString() === id) {
          // because the id is the same, return 200
          res.json({id, container});
        } else {
          // found a tube, but it is not empty, and the content is not the target part
          res.status(409).json({message:`the target tube is already in use`});
        }
      } else {
        if (!container) {
          container = new Container({
            ctype:'tube',
            barcode,
            assignedAt: new Date(),
            operator: req.currentUser.id,
            currentStatus: 'empty',
          });
        }
        if (part.containers === undefined) {
          part.containers = [];
        }
        if (!part.containers.find(v=>v.barcode === barcode)) {
          console.debug('new barcode', barcode);
          container.part = part;
          await container.save();
          part.containers.push(container);
          await part.save();
          req.log.info(`${req.currentUser.fullName} assigned a new tube ${barcode} to part ${part.personalName} (${part._id})`);
        }
        res.json({id:part._id, containers: part.containers});
      }
    } catch(err) {
      res.status(404).json({message:err.message});
      console.log(err);
    }
  })

  /** 
   * resign a tube from a part
   * different from DELETE /api/tube/:id, this API requires the part id. it will verify the part owner, and assigned time.
   * the previledge is lower.
   */
  app.delete('/api/part/:id/tube/:barcode', userCanUseScanner, async (req :Request, res: Response) => {
    const {id, barcode} = req.params;
    try {
      const part = await Part.findOne({
        _id:id,
        'containers.ctype':'tube',
        'containers.barcode':barcode,
        'containers.assignedAt': {$gt: new Date(Date.now() - config.maxTubeDeleteLimit) }}).exec();
      if (part) {
        part.containers = part.containers.filter(v=>v.barcode !== barcode);
        await part.save();
        req.log.info(`${req.currentUser.fullName} r emoved tube ${barcode} from part ${part.personalName} (${part._id})`);
        res.json({id:part._id, containers: part.containers});
      } else {
        const part = await Part.findOne({
          _id:id,
          'containers.ctype':'tube',
          'containers.barcode':barcode,
        });
        if (part) {
          res.status(401);
        } else {
          res.status(404);
        }
        res.json({message:'unable to delete tube'})
      }
    } catch(err) {
      res.status(404).json({message:err.message});
      console.log(err);
    }
  })


  app.get('/api/parts/search/:keyword', userMustLoggedIn, async (req: Request, res: Response) => {
    const {keyword} = req.params;
    let {skip, limit} = req.query;
    console.debug(`search key = "${keyword}"`);
    try {
      if(!skip) skip = '0';
      if(!limit) limit = '10';
      skip = parseInt(skip);
      limit = parseInt(limit);
      if (limit > 100) limit = 100;

      const count = await Part.count({$text:{$search:keyword}}).exec();
      const parts = await Part.find({$text:{$search:keyword}}).skip(skip).limit(limit).exec();

      res.json({keyword, count, skip, limit, parts});
    } catch (err) {
      res.status(404).json({message:err.message});
      console.log(err);
    }
  });
}

