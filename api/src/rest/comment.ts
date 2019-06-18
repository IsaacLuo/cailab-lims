import { FileData, LogOperation, Part, Comment } from './../models';
/**
 * @file CRD of attachments
 * GET    /api/attachement/:id
 * POST   /api/attachment
 * DELETE /api/attachment/:id
 * GET    /api/attachment/:id/metadata
 */

import { 
  Ctx,
  Next,
} from '../types';

import { 
  Container,
} from './../models';

import koa from 'koa';
import Router from 'koa-router';
import {userMust, beAdmin, beUser, beScanner} from '../identifyUsers'
import fs from 'fs';
import util from 'util';
import { Schema } from 'mongoose';
const readFile = util.promisify(fs.readFile);

/**
 * handles the CURD of containers
 * GET /api/containers
 */
export default function handleComments (app:koa, router:Router) {

  router.post(
    '/api/part/:partId/comments/',
    userMust(beUser),
    async (ctx:Ctx, next:Next) => {
      const {partId} = ctx.params;
      const {text, attachments} = ctx.request.body;
      
      const attachmentIds = [];
      if(attachments) {
        for(const attachment of attachments) {
          if (typeof (attachment) === 'string') {
            const att = await FileData.findById(attachment).exec();
            if (att) {
              attachmentIds.push(attachment);
            }
          } else {
            let attContent = attachment.data;
            if (/data:(.*);base64,/.test(attContent)) {
              attContent = attContent.split(',')[1];
            }
            const att = new FileData({
              name: attachment.name,
              data: new Buffer(attContent, 'base64'),
              size: attachment.size,
              contentType: attachment.contentType,
            });
            await att.save();
            attachmentIds.push(
              att._id,
            );
          }
        }

      }

      const comment = await Comment.create({
        text,
        attachments: attachmentIds,
        createdAt: new Date(),
        author: ctx.state.user._id,
        part: partId,
      })

      ctx.body = comment;
    }
  );
  router.get(
    '/api/part/:partId/comments/',
    userMust(beUser),
    async (ctx:Ctx, next:Next) => {
      const {partId} = ctx.params;
      ctx.body = await Comment.find({part:partId})
      .populate('attachments', 'name size contentType')
      .populate('author')
      .exec();
    }
  );
  router.delete(
    '/api/part/:partId/comment/:commentId',
    userMust(beUser),
    async (ctx:Ctx, next:Next) => {
      const {partId, commentId} = ctx.params;
      ctx.body = await Comment.deleteOne({_id:commentId, part:partId}).exec();
    }
  );

}