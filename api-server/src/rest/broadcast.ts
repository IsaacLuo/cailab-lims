/**
 * @file get and set boradcase messages in the main page.
 * GET    /api/broadcast
 * POST   /api/broadcast
 */
import {Express, Response} from 'express'
import {Broadcast} from '../models'
import {Request} from '../MyRequest'
import {or, beUser, beAdmin} from '../MyMiddleWare'
import mongoose from 'mongoose'

const ObjectId = mongoose.Types.ObjectId;

/**
 * express processes group
 * @param app, the express instance, passed by the main express function.
 * @param upload, the multer object, to analyse multipart/formdata body.
 */
export default function hanleBroadcasts(app:Express) {
/**
 * to download the newest broadcast
 * responses:
 * 200: the file data in raw
 * 404: unable to find the file
 */
  app.get('/api/broadcast', or(beUser), async (req :Request, res: Response) => {
    try {
      const broadcast = await Broadcast.findOne().sort({ _id: -1 }).exec();
      if (broadcast) {
        res.json(broadcast);
      } else {
        res.status(200).json({message:''});
      }
    } catch (err) {
      res.status(404).json({message:err.message});
    }
  });

  /**
   * to upload a new broadcast
   * body: {message: broadcast Content}
   * responses:
   * 200: OK
   * 500: unable to save broadcast
   */
  app.post('/api/broadcast', or(beAdmin), async (req :Request, res: Response) => {
    try {
      const message = req.body.message;
      await Broadcast.create({message});
      res.json({message:'OK'});
    } catch (err) {
      console.log(err);
      res.status(500).json({message:err.message});
    }
  });
}


