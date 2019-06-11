import { FileData, LogOperation } from './../models';
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
const readFile = util.promisify(fs.readFile);

/**
 * handles the CURD of containers
 * GET /api/containers
 */
export default function handleAttachment (app:koa, router:Router) {

  /**
 * to download an attachment
 * @param id: the mongodb id of the FileData
 * responses:
 * 200: the file data in raw
 * 404: unable to find the file
 */
  router.get(
    '/api/attachment/:id',
    userMust(beUser),
    async (ctx:Ctx, next:Next) => {
      const {id} = ctx.params;
      if(id === undefined) {
        ctx.throw(404, {message: 'file not found'});
      }
      const file = await FileData.findById(id);
      if(file){
        // mark this is a downlaoding, and set the suggested file name.
        ctx.set('Content-Disposition', `attachment;filename=${file.name}`);
        ctx.set('Content-Type', file.contentType);
        // send file conent in raw.
        ctx.body = file.data;
      } else {
        ctx.throw(404, {'message': 'file not found'});
      }
    });

  /**
   * to upload a new file as an attchment object.
   * header:
   *   - Content-type must be multipart/formdata
   * body:
   *   - file: the uploaded file
   * responses:
   * 200: OK
   *    - id: the id of created attachment
   * 500: unable to save attachment
   */
  router.post(
    '/api/attachment',
    userMust(beUser), 
    async (ctx:Ctx, next:Next) => {
      const {file} = ctx.request.files;
      // console.log(file);
      if (!file) {
        ctx.throw(400);
      }

      const inputBuffer = await readFile(file.path);
      // console.log(inputBuffer.length);
      const fileData = new FileData({
        name: file.name,
        size: file.size,
        contentType: file.type,
        data: inputBuffer,
      })
      await fileData.save();
      // =============log================
      LogOperation.create({
        operator: ctx.state.user._id,
        operatorName: ctx.state.user.name,
        type: 'create attachment',
        level: 3,
        sourceIP: ctx.request.ip,
        timeStamp: new Date(),
        data: {
          name: file.name,
          contentType: file.type,
          size: file.size, 
        },
      });
      // ===========log end=============
      ctx.body = {
        _id: fileData._id,
        name: fileData.name,
        size: fileData.size,
        contentType: fileData.contentType
      };
  });

  /**
   * to delete an attachment in db, however, it can only delete the attachment 
   * not in use. otherwise, the attachment ID must be removed from the part at
   * first
   * @param id: the mongodb id of the FileData
   * responses:
   * 200: the attachment has been deleted
   * 403: the attachment is in using, can't be deleted
   * 404: can't find target
   */
  // app.delete('/api/attachment/:id', or(beUser), async (req :Request, res: Response) => {
  //   try {
  //     const {id} = req.params;
  //     if(id === undefined) {
  //       res.status(404).json({message: 'file not found'})
  //     }
  //     // check if the attachment is in using

  //     const part = await Part.findOne({'attachments.fileId':ObjectId(id)}).exec();
  //     if (!part) {
  //       const result = await FileData.findOneAndDelete({_id:id})
  //       res.json({message:'OK', result});
  //       // =============log================
  //       LogOperation.create({
  //         operator: req.currentUser.id,
  //         operatorName: req.currentUser.fullName,
  //         type: 'delete attachment',
  //         level: 4,
  //         sourceIP: req.ip,
  //         timeStamp: new Date(),
  //         data: result,
  //       });
  //       // ===========log end=============
  //     } else {
  //       res.status(403).json({message: `${part._id} (${part.labName}) is using this attachment`});
  //     }

  //   } catch (err) {
  //     res.status(404).json({message:err.message});
  //   }
  // });


  // interface IFileMetaData {
  //   _id: string,
  //   name: string,
  //   size: string,
  //   contentType: string,
  // }
  // /**
  //  * to get the metadata of file id
  //  * @param id: the mongodb id of the FileData
  //  * responses:
  //  * 200: file metadataContent as IFileMetaData
  //  * 404: can't find target
  //  */
  // app.get('/api/attachment/:id/metadata', or(beUser), async (req :Request, res: Response) => {
  //   try {
  //     const {id} = req.params;
  //     console.log('getting file', id)
  //     if(id === undefined) {
  //       res.status(404).json({message: 'file not found'});
  //     }
  //     const file:IFileMetaData = await FileData.findOne({_id:id},'_id name size contentType');
  //     if(file){
  //       res.json(file);
  //     } else {
  //       res.status(404).json({message: 'file not found'});
  //     }
  //   } catch (err) {
  //     res.status(404).json({message:err.message});
  //   }
  // });

}