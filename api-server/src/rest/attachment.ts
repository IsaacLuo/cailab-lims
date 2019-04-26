/**
 * @file CRD of attachments
 * GET    /api/attachement/:id
 * POST   /api/attachment
 * DELETE /api/attachment/:id
 * GET    /api/attachment/:id/metadata
 */
import {Express, Response} from 'express'
import {Part, FileData, LogOperation} from '../models'
import {Request} from '../MyRequest'
import {or, beUser} from '../MyMiddleWare'
import mongoose from 'mongoose'
import multer from 'multer'

const ObjectId = mongoose.Types.ObjectId;

/**
 * express processes group
 * @param app, the express instance, passed by the main express function.
 * @param upload, the multer object, to analyse multipart/formdata body.
 */
export default function handleAttachments(app:Express, upload:multer.Instance) {

/**
 * to download an attachment
 * @param id: the mongodb id of the FileData
 * responses:
 * 200: the file data in raw
 * 404: unable to find the file
 */
  app.get('/api/attachment/:id', or(beUser), async (req :Request, res: Response) => {
    try {
      const {id} = req.params;
      if(id === undefined) {
        res.status(404).json({message: 'file not found'})
      }
      const file = await FileData.findOne({_id:id});
      if(file){
        // mark this is a downlaoding, and set the suggested file name.
        res.set('Content-Disposition', `attachment;filename=${file.name}`);
        // send file conent in raw.
        res.send(file.data);
      } else {
        res.status(404).json({'message': 'file not found'})
      }
    } catch (err) {
      res.status(404).json({message:err.message});
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
  app.post('/api/attachment', or(beUser), upload.single('file'), async (req :Request, res: Response) => {
    try {
      if (!req.file) {
        throw new Error('no file');
      }
      const fileData = new FileData({
        name: req.file.originalname,
        size: req.file.size,
        contentType: req.file.mimetype,
        data: req.file.buffer,
      })
      await fileData.save();
      res.json({message:'OK', id:fileData._id});
      // =============log================
      LogOperation.create({
        operator: req.currentUser.id,
        operatorName: req.currentUser.fullName,
        type: 'create attachment',
        level: 3,
        sourceIP: req.ip,
        timeStamp: new Date(),
        data: {
          name: req.file.originalname,
          contentType: req.file.mimetype,
          size: req.file.size, 
        },
      });
      // ===========log end=============
    } catch (err) {
      console.log(err);
      res.status(500).json({message:err.message});
    }
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
  app.delete('/api/attachment/:id', or(beUser), async (req :Request, res: Response) => {
    try {
      const {id} = req.params;
      if(id === undefined) {
        res.status(404).json({message: 'file not found'})
      }
      // check if the attachment is in using

      const part = await Part.findOne({'attachments.fileId':ObjectId(id)}).exec();
      if (!part) {
        const result = await FileData.findOneAndDelete({_id:id})
        res.json({message:'OK', result});
        // =============log================
        LogOperation.create({
          operator: req.currentUser.id,
          operatorName: req.currentUser.fullName,
          type: 'delete attachment',
          level: 4,
          sourceIP: req.ip,
          timeStamp: new Date(),
          data: result,
        });
        // ===========log end=============
      } else {
        res.status(403).json({message: `${part._id} (${part.labName}) is using this attachment`});
      }

    } catch (err) {
      res.status(404).json({message:err.message});
    }
  });


  interface IFileMetaData {
    _id: string,
    name: string,
    size: string,
    contentType: string,
  }
  /**
   * to get the metadata of file id
   * @param id: the mongodb id of the FileData
   * responses:
   * 200: file metadataContent as IFileMetaData
   * 404: can't find target
   */
  app.get('/api/attachment/:id/metadata', or(beUser), async (req :Request, res: Response) => {
    try {
      const {id} = req.params;
      console.log('getting file', id)
      if(id === undefined) {
        res.status(404).json({message: 'file not found'});
      }
      const file:IFileMetaData = await FileData.findOne({_id:id},'_id name size contentType');
      if(file){
        res.json(file);
      } else {
        res.status(404).json({message: 'file not found'});
      }
    } catch (err) {
      res.status(404).json({message:err.message});
    }
  });
}


