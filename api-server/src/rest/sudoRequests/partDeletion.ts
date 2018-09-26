import {Express, Response} from 'express'
import {Part, PartDeletionRequest} from '../../models'
import {Request} from '../../MyRequest'
import {userMustLoggedIn, userMustBeAdmin} from '../../MyMiddleWare'

export default function handlePartDeletion(app:Express) {
  app.get('/api/sudoRequests/partDeletions', userMustBeAdmin, async (req :Request, res: Response) => {
  try {
    const requests = await PartDeletionRequest.find({}).exec();
    const requestDict: any = {};
    const ids = requests.map(item=>{
      requestDict[item.partId] = item;
      return item.partId;
    });
    
    const parts = await Part.find({_id:{$in:ids}}).exec();
    const ret = parts.map((item)=>({
      part: item,
      request: requestDict[item._id],
    }));
    res.json(ret);
  } catch (err) {
    res.status(500).json({err})
  }
});

app.put('/api/sudoRequests/partDeletion/:id', userMustLoggedIn, async (req :Request, res: Response) => {
  try {
    const {id} = req.params;
    console.log('request to delete ', id);
    const part = await Part.findById(id).exec();
    if (part.ownerId.toString() !== req.currentUser.id && req.currentUser.groups.indexOf('administrators')===-1) {
      res.status(401).json({message: 'unable to delete a part of others'});
    } else {
      try {
        const deletionRequest = await PartDeletionRequest.findOneAndUpdate(
          {partId: id},
          {
            senderId: req.currentUser.id,
            senderName: req.currentUser.fullName,
            partId: id,
            $inc:{requestedCount:1},
            $push:{requestedAt: Date.now()},
          },
          {new: true, upsert: true}
        ).exec();
        res.json(deletionRequest);
      } catch (_) {
        console.log('create new one');
        const createResult = await PartDeletionRequest.create({
          senderId: req.currentUser.id,
          senderName: req.currentUser.fullName,
          partId: id,
          requestedCount: 1,
          requestedAt: [Date.now()],
        });
        res.json(createResult);
      }
      
      
    }
  } catch (err) {
    console.log(err)
    res.status(500).json({err})
  }
});


// just delete the requests, it won't delete a part
app.delete('/api/sudoRequests/partDeletion/:id', userMustBeAdmin, async (req :Request, res: Response) => {
  try {
    const {id} = req.params;
    const parts = PartDeletionRequest.deleteMany({partId:id}).exec();
    console.log(parts);
    res.json(parts);
  } catch (err) {
    console.log(err)
    res.status(500).json({err})
  }
});
}

