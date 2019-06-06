import { Part, ContainerGroup, LogOperation } from './../models';
import { 
PartsIdCounter,
FileData,
} from '../models';
import { 
  Ctx,
  Next, 
} from '../types';

import koa from 'koa';
import Router from 'koa-router';

import {userMust, beAdmin, beUser} from '../identifyUsers'
import { User, LogLogin } from '../models';
import jwt from 'jsonwebtoken';
import secret from '../../secret';

export default function handleParts (app:koa, router:Router) {

  router.post('/api/part',
    userMust(beUser),
    async (ctx:Ctx, next:Next)=> {
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
}