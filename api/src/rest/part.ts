import { 
  Part, 
  Container,
  ContainerGroup, 
  LogOperation, 
  PartDeletionRequest, 
  PartHistory, 
  IPartModel,
  PartsIdCounter,
  FileData,
} from './../models';

import { 
  Ctx,
  Next,
  IAttachment,
  IPartForm,
} from '../types';

import koa from 'koa';
import Router from 'koa-router';

import {userMust, beAdmin, beUser, beScanner} from '../identifyUsers'
import { User, LogLogin } from '../models';
import jwt from 'jsonwebtoken';
import secret from '../../secret';
import mongoose, { Schema } from 'mongoose';
import sendBackXlsx from '../sendBackXlsx';

/**
 * handles the CURD of parts and parts related
 * POST /api/part
 * GET /api/part/:id
 * GET /api/parts
 * DELETE /api/part/:id
 * PUT /api/part/:id
 * GET /api/parts/count
 * GET /api/part/:id/tubes
 * PUT /api/part/:id/tube/:barcode
 * DELETE /api/part/:id/tube/:barcode
 * GET /api/parts/search/:keyword
 */
export default function handleParts (app:koa, router:Router) {

  /**
   * create a new part
   */
  router.post(
    '/api/part',
    userMust(beUser),
    async (ctx:Ctx, next:Next) => {
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
      // tube barcode for creating container if not null
      plateBarcode,
      wellId,
      tubeBarcode,
    } = ctx.request.body;
  
    try {
      const currentUser = await User.findById(ctx.state.user._id).exec();
      const abbr = currentUser.abbr;
      if(!abbr || abbr.length < 2) {
        ctx.throw(401, 'invalid abbr');
      }
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
      if(attachments) {
        for(const attachment of attachments) {
          if (typeof (attachment) === 'string') {
            const att = await FileData.findById(attachment).exec();
            if (att) {
              attachmentIds.push(
                {
                  name: att.name,
                  contentType: att.contentType,
                  size: att.size,
                  file: att._id,
                }
              );
            }
          } else {
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
                name: attachment.name,
                contentType: attachment.type,
                size: attachment.size,
                file: att._id,
              }
            );
          }
        }
    
        ctx.state.logger.info('saved attachmes', attachmentIds.length);
      }
  
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
        owner: currentUser._id,
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
      
      let parentContainer;
      const parentContainerType = tubeBarcode ? 'rack' : 'plate';
      if (plateBarcode) {
        parentContainer = await ContainerGroup.findOne({barcode:plateBarcode}).exec();
        if (parentContainer) {
          if (parentContainer.ctype !== parentContainerType) {
            // wrong type
            ctx.throw(403, {message: `the barcode belongs a ${parentContainer.ctype}, not a ${parentContainerType}`});
          }
        } else {
          parentContainer = await ContainerGroup.create({
            ctype: parentContainerType,
            barcode: plateBarcode,
            createdAt: now,
            currentStatus: 'created',
          });
        }
      }

      await part.save();
      // =============log================
      LogOperation.create({
        operator: currentUser.id,
        operatorName: currentUser.name,
        type: 'create part',
        level: 3,
        sourceIP: ctx.request.ip,
        timeStamp: new Date(),
        data: { part },
      });
      // ===========log end=============
      ctx.body = part;
    } catch (err) {
      
      ctx.throw(500, {err: err.toString()});
    }
    }
  );

  /**
   * get a part by id
   */
  router.get(
    '/api/part/:id',
    userMust(beUser, beScanner),
    async (ctx:Ctx, next:Next) => {
      const user = ctx.state.user;
      const partId = ctx.params.id;
      try {
        let part = await Part.findById(partId).exec();
        console.log(part);
        ctx.body = part;
      } catch (err) {
        ctx.throw(404, err.message);
      }
    }
  );

  /**
   * search parts by conditions
   */
  router.get(
    '/api/parts',
    userMust(beUser), 
    async (ctx:Ctx, next:Next) => {
      let {
        search, 
        type, 
        skip, 
        limit, 
        user, 
        sortBy, 
        desc, 
        format
      } = ctx.query;

      let condition :any = {};
      if (search) {
        condition.$text = {$search:search};
      }
      if (type) {
        condition.sampleType = type;
      }
      if (user) {
        condition.owner = mongoose.Types.ObjectId(user);
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
      let totalCount = await Part.countDocuments(condition).exec();

      // .select('labName')
      const data = await parts
      .populate('containers')
      .exec();
      switch(format) {
        case 'xlsx':
          sendBackXlsx(ctx, data);
        break;
        default:
          ctx.body = {
            filter: {type, skip, limit, user, sortBy, order: desc ? 'desc': 'asc'},
            totalCount, 
            parts: data,
            };
      }
    }
  );

  /**
   * delete a part
   */
  router.delete(
    '/api/part/:id',
    userMust(beUser),
    async (ctx:Ctx, next:Next) => {
      const user = ctx.state.user;
      try {
        const partId = ctx.params.id;
        ctx.state.logger.info(`${ctx.request.ip} delete part ${partId}`);
        const part = await Part.findById(partId).exec();
        if(!part) {
          await PartDeletionRequest.findOneAndDelete({partId}).exec();
          ctx.throw(404, {message: 'no this part'});
        }
        if (
          part.owner.toString() !== user._id && 
          user.groups.indexOf('administrators')===-1
          ) {
          ctx.throw(401, {message: 'unable to delete a part of others'});
        } else if (
          Date.now() - part.createdAt.getTime() > 3600000 * 24 * 7 &&
          user.groups.indexOf('administrators')===-1
          ) {
          ctx.throw(401, {message: 'unable to delete a part older than 1 week'});
        } else {
          // ===============save history before change=============
          let partHistory = await PartHistory.findOne({partId: part._id}).exec();
          if (!partHistory) partHistory = new PartHistory({partId: part._id, histories:[] });
          partHistory.histories.push(part);
          await partHistory.save();
          // ===============end saving hisoty======================
          await Part.findOneAndDelete({_id:partId}).exec(); 
          await PartDeletionRequest.findOneAndDelete({partId}).exec();
          ctx.body = part;
          // =============log================
          LogOperation.create({
            operator: user._id,
            operatorName: user.name,
            type: 'delete part',
            level: 4,
            sourceIP: ctx.request.ip,
            timeStamp: new Date(),
            data: { part },
          });
          // ===========log end=============
        }
      } catch (err) {
        console.error('err', err);
        ctx.throw(500);
      }
    });

  /**
   * modify a part
   * @body IPartForm {
                    sampleType?: string,
                    comment?: string,
                    date?: Date,
                    tags?: string[],
                    markers?: string[],
                    plasmidName?: string,
                    hostStrain?: string,
                    parents?: string[],
                    genotype?: string[],
                    plasmidType?: string,
                    sequence?: string,
                    orientation?: string,
                    meltingTemperature?: number,
                    concentration?: string,
                    vendor?: string,
                    attachments?: IPartFormAttachment[],
                    customData?: any,
                    }
   */
  router.put(
    '/api/part/:id',
    userMust(beUser),
    async (ctx:Ctx, next:Next) => {
      const partId = ctx.params.id;
      const user = ctx.state.user;
      const form:IPartForm = ctx.request.body;
      try {
          const part:IPartModel = await Part.findById(partId).exec();
        // user must own this part
        if (part._id.toString() === partId && part.owner.toString() === user._id) {
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
                  file: fileData._id,
                  name: fileData.name,
                  contentType: fileData.contentType,
                  size: fileData.size,
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
                  file: fileData._id,
                  name: fileData.name,
                  contentType: fileData.contentType,
                  size: fileData.size,
                });
              } else {
                throw new Error('incorrect attachmentformat');
              }
            }
            part.attachments = newAttachments;
          } catch(err) {
            ctx.state.logger.error(err);
            ctx.throw(401, {message: 'unable to modify this part', err: err.message});
            return;
          }
          await part.save();
          ctx.body = {message:'OK', part};
          // =============log================
          LogOperation.create({
            operator: ctx.state.user._id,
            operatorName: ctx.state.user.name,
            type: 'update part',
            level: 4,
            sourceIP: ctx.request.ip,
            timeStamp: new Date(),
            data: { part },
          });
          // ===========log end=============
        } else {
          ctx.throw(401);
        }
      } catch (err) {
        ctx.throw(404);
      }
    }
  );

  /**
   * get count of all parts
   * @query {
   *   type:string bacterium, primer or yeast
   *   owner:string owner's id
   * }
   */
  router.get(
    '/api/parts/count',
    userMust(beUser),
    async (ctx:Ctx, next:Next) => {
      let {type, owner} = ctx.request.query;

      let condition :any = {};
      if (type) {
        condition.sampleType = type;
      }
      if (owner) {
        condition.owner = owner;
      }
      const count = await Part.countDocuments(condition).exec();
      ctx.body = {count};
    }
  )

  /**
   * get tubes of a part
   */
  router.get(
    '/api/part/:id/tubes',
    userMust(beUser),
    async (ctx:Ctx, next:Next) => {
      const {id} = ctx.params;
      const part = await Part.findById(id).select('containers').populate('containers').exec();
      ctx.body = part.containers;
    }
  );

  /**
   * assgin a tube to a part, designed for barcode scanner
   */
  router.put(
    '/api/part/:id/tube/:barcode',
    userMust(beUser),
    async (ctx:Ctx, next:Next) => {
      const {id, barcode} = ctx.params;
      try {
        const part = await Part.findById(id).exec();
        if(!part) {
          ctx.throw(404, {message:`unable to find part ${id}`});
          return;
        }
        // try to find a tube with given barcode
        let container = await Container.findOne({barcode}).exec();
        if(container && container.currentStatus !== 'empty' && container.currentStatus !== undefined) {
          if (container.part && container.part.toString() === id) {
            // because the id is the same, return 200
            ctx.body = {id, container, message: 'use exist tube'};
          } else {
            // found a tube, but it is not empty, and the content is not the target part
            ctx.status = 409;
            ctx.body = {message:`the target tube is already in use`, container};
          }
        } else {
          ctx.state.logger.info('create new tube');
          if (!container) {
            container = new Container({
              ctype:'tube',
              barcode,
              assignedAt: new Date(),
              operator: ctx.state.user._id,
              currentStatus: 'empty',
            });
          }
          if (part.containers === undefined) {
            console.log('init first container');
            part.containers = [];
            await part.save();
          }

          console.debug('new barcode', barcode);
          container.part = part._id;
          container.currentStatus = 'filled';
          const ss = await container.save();
          console.log(ss);
          part.containers.push(container._id);
          await part.save();
          ctx.state.logger.info(`${ctx.state.user.name} assigned a new tube ${barcode} to part ${part.personalName} (${part._id})`);
          
          ctx.body = {id:part._id, containers: part.containers};
        }
      } catch(err) {
        ctx.throw(404, {message:err.message});
        ctx.state.logger.log(err);
      }
    }
  );

  /** 
   * resign a tube from a part
   * different from DELETE /api/tube/:id, this API requires the part id. it will verify the part owner, and assigned time.
   * the previledge is lower.
   */
  router.delete(
    '/api/part/:id/tube/:barcode',
    userMust(beUser),
    async (ctx:Ctx, next:Next) => {
      const {id, barcode} = ctx.params;
        const container = await Container.findOne({barcode, part:id}).exec();
        if(container) {
          const part = await Part.findById(id).exec();
          if (part) {
            part.containers = part.containers.filter(_id => _id.toString()!==container._id.toString()); //(_id as Schema.Types.ObjectId).equals(container._id));
            console.log(part.containers);
            await part.save();
            
            container.part = undefined;
            container.currentStatus = 'empty';
            await container.save();

            ctx.state.logger.info(`${ctx.state.user.name} removed tube ${barcode} from part ${part.personalName} (${part._id})`);
            ctx.body = {id:part._id, containers: part.containers};
            return;
          }
        }

        const part = await Part.findById(id);
        if (part) {
          ctx.throw(401);
        } else {
          ctx.throw(404);
        }
        ctx.throw(500, {message:'unable to delete tube'});
    }
  );

  router.get(
    '/api/parts/search/:keyword',
    userMust(beUser),
    async (ctx:Ctx, next:Next) => {
      const {keyword} = ctx.params;
      let {skip, limit} = ctx.query;
      // console.debug(`search key = "${keyword}"`);
      try {
        if(!skip) skip = '0';
        if(!limit) limit = '10';
        skip = parseInt(skip);
        limit = parseInt(limit);
        if (limit > 100) limit = 100;

        const count = await Part.count({$text:{$search:keyword}}).exec();
        const parts = await Part.find({$text:{$search:keyword}}).skip(skip).limit(limit).exec();

        ctx.body = {keyword, count, skip, limit, parts};
      } catch (err) {
        ctx.throw(404, {message:err.message});
        console.log(err);
      }
    }
  );
}