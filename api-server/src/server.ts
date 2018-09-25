import express from 'express'
import {Response, NextFunction} from 'express'
import verifyGoogleToken from './googleOauth'
import cors from 'cors'
import * as bodyParser from 'body-parser'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import secret from '../secret.json'
import {User, Part, FileData, PartsIdCounter, PartDeletionRequest} from './models'
import sendBackCsv from './sendBackCsv'
import sendBackXlsx from './sendBackXlsx'

interface IUserInfo {
  id:string,
  fullName: string,
  email: string,
  groups: [string],
}
interface IUserJWT extends IUserInfo {
  iat: number,
  exp: number,
}

interface Request extends express.Request {
  currentUser :IUserJWT,
}



const ObjectId = mongoose.Types.ObjectId;

const app = express()

app.use(cors())

app.use(bodyParser.json({ type: 'application/json' , limit:'10MB'}))

app.use((req :Request, res :Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`)
  res.set('Cache-Control', 'public, max-age=1');
  next();
});

app.use(async (req :Request, res :Response, next: NextFunction) => {
  const mongooseState = mongoose.connection.readyState;
  switch (mongooseState) {
    case 3:
    case 0:
    console.log('mongooseState=', mongooseState);
    await mongoose.connect(
      secret.mongoDB.url,
      {
        useNewUrlParser: true,
        user: secret.mongoDB.username,
        pass: secret.mongoDB.password, 
      }
    );
    break;
  }
  next();
});

// get user group
app.use((req :Request, res :Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (auth) {
    const [tokenType, token] = auth.split(' ');
    if (tokenType === 'bearer') {  
      jwt.verify(token, secret.jwt.key, (err, decoded :IUserJWT) => {
        if (!err) {
          // console.log('verified user');
          // console.log(decoded);
          req.currentUser = decoded;
        } else {
          console.log('bad verification');
        }
        next();
      })
    } else {
      res.status(401).json('unacceptable token');
    }
  } else {
    next();
  }
})

function userMustBeAdmin (req :Request, res :Response, next: NextFunction) {
  if (req.currentUser && req.currentUser.groups.indexOf('administrators')>=0) {
    console.log('currentGoup', req.currentUser.groups)
    next();
  } else if (req.headers['test-token'] === 'a30aa7f7de512963a03c') {
    req.currentUser = {
      id:'5b718be08274212924fe4a94',
      fullName: 'test man',
      email: 'yishaluo@gmail.com',
      groups: ['users'],
      iat: Math.floor(Date.now()),
      exp: Math.floor(Date.now()) + 3600,
    }
    next();
  } else {
    res.status(401).json({message: 'require admin'})
  }
}

function userMustLoggedIn (req :Request, res :Response, next: NextFunction) {
  if (req.headers['test-token'] === 'a30aa7f7de512963a03c') {
    req.currentUser = {
      id:'5b718be08274212924fe4a94',
      fullName: 'test man',
      email: 'yishaluo@gmail.com',
      groups: ['users'],
      iat: Math.floor(Date.now()),
      exp: Math.floor(Date.now()) + 3600,
    }
  }
  if (req.currentUser && req.currentUser.groups.indexOf('users')>=0) {
    next();
  } else {
    res.status(401).json({message: 'require log in'})
  }
}

app.get('/test/',(req :Request, res: Response) => {
  res.json({foo:'get'})
})

app.post('/api/googleAuth/', async (req :Request, res: Response) => {
  try {
    console.log(req.body)
    const {name, email} = await verifyGoogleToken(req.body.token);
    const abbr = name.trim().split(' ').map(v=>v[0]).join('').toUpperCase();
    console.log(`verified user ${name} ${email}`)
    let groups = []
      const user = await User.findOne({email})
      console.log(`found user ${user}`)
      let id = '';
      if (!user) {
        // no user, create one
        const newUser = new User({
          name,
          email,
          abbr,
          authType: 'google',
          groups: ['guests'],
        });
        console.log(`new user: ${newUser}`)
        groups.push('guests')
        await newUser.save();
        id = newUser.id;
      } else {
        groups = user.groups;
        id = user.id;
      }
    const token = jwt.sign({
        id,
        fullName: name,
        email,
        groups,
      }, 
      secret.jwt.key,
      {expiresIn:'1h'})
    res.json({message: `welcome ${name}`, id, token, name, email, groups})
    
  } catch (err) {
    console.log(err);
    res.status(401).json({message: err})
  }
})



app.get('/api/users/names/', userMustLoggedIn, async (req :Request, res: Response) => {
  let users = await User.find({groups:'users'});
  users = users.map(user => ({
    name: user.name,
    id: user.id,
  }));
  res.json(users);
});



app.get('/api/currentUser', async (req :Request, res: Response) => 
{ 
  if (req.currentUser) {
  const {id, fullName, email, groups, exp} = req.currentUser;
  const now = Math.floor(Date.now()/1000);
  console.log({exp, now})
  let payload :{id:string, fullName :string, groups: string[], token?:string, tokenExpireIn?:number} = {id, fullName, groups}
  if (now < exp && exp - now < 1200) {
    payload.token = jwt.sign({
      id,
      fullName,
      email,
      groups,
    }, 
    secret.jwt.key,
    {expiresIn:'1h'})
  } else {
    payload.tokenExpireIn = exp - now;
  }
  res.json(payload);
} else {
  res.json({id:'guest', fullName: 'guest', groups:['guest']})
}
});

// ===========================parts======================================

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
        case 'csv':
        sendBackCsv(res,data);
        break;
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

app.get('/api/parts/countAll', userMustLoggedIn, async (req :Request, res: Response) => {
  try {
    const bacteria = await Part.countDocuments({sampleType:'bacterium'}).exec();
    const primers = await Part.countDocuments({sampleType:'primer'}).exec();
    const yeasts = await Part.countDocuments({sampleType:'yeast'}).exec();
    res.json({ bacteria, primers, yeasts });
  } catch (err) {
    res.status(500).json({err})
  }
});

app.get('/api/statistic', async (req :Request, res: Response) => {
  try {
    const ret:any = {};
    ret.count = {};
    ret.count.bacteria = await Part.countDocuments({sampleType:'bacterium'}).exec();
    ret.count.primers = await Part.countDocuments({sampleType:'primer'}).exec();
    ret.count.yeasts = await Part.countDocuments({sampleType:'yeast'}).exec();
    ret.monthlyStatistic = await Part.aggregate([
      {
        $project: {
          ym: {
            $dateToString: {
              format: '%Y-%m', 
              date: '$createdAt'
            }
          }
        }
      }, {
        $group: {
          _id: '$ym', 
          count: {
            $sum: 1
          }
        }
      }, {
        $sort: {
          _id: 1
        }
      }
    ]);
    res.json(ret);
  } catch (err) {
    res.status(500).json({err})
  }
});

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

app.get('/api/notifications', userMustLoggedIn, async (req :Request, res: Response) => {
  try {
    const notifications:{title:string, message:string, link:string}[] = [];
    if (req.currentUser.groups.indexOf('administrators')>=0) {
      const sudoRequestCount = await PartDeletionRequest.countDocuments({}).exec();
      if (sudoRequestCount>0) {
        notifications.push({
          title: 'requests from users', 
          message: `You have ${sudoRequestCount} request${sudoRequestCount === 1? '': 's'} of deleting parts`,
          link: '/requests/partsDeletion',
        });
      }
    }
    res.json(notifications);
  } catch (err) {
    res.status(500).json({err});
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

// ============================attachments=====================================
app.get('/api/attachments/:id', userMustLoggedIn, async (req :Request, res: Response) => {
  try {
    const {id} = req.params;
    console.log('getting file', id)
    if(id === undefined) {
      res.status(404).json({message: 'file not found'})
    }
    const file = await FileData.findOne({_id:id});
    if(file){
      res.send(file.data);
    } else {
      res.status(404).json({'message': 'file not found'})
    }
  } catch (err) {
    res.status(404).json({err})
  }
});

// ===========================admin==========================================
app.get('/api/users', userMustBeAdmin, async (req :Request, res: Response) => {
  let users = await User.find({}).sort({groups: -1, createdAt:1 });
  users = users.map(user => ({
    id: user._id,
    abbr: user.abbr,
    email: user.email,
    authType: user.authType,
    name: user.name,
    createdAt: user.createdAt,
    groups: user.groups,
  }));
  res.json(users);
})

app.put('/api/user/:email/privilege', userMustBeAdmin, async (req :Request, res: Response) => {
  const {email} = req.params
  try {
    const user = await User.findOne({email})
    console.log('found user', user)
    if (user) {
      let groups = new Set(user.groups);
      for(const key of Object.keys(req.body)) {
        if (req.body[key] === true && !groups.has(key)) {
          groups.add(key);
        } else if (req.body[key] === false && groups.has(key)) {
          groups.delete(key);
        }
      }
      user.groups = Array.from(groups);
      user.save();
      res.json({message:'OK'});   
    } else {
      res.status(404).json({message: 'user not found'})
    }
  } catch (err) {
    res.status(404).json({message: 'user not found', err})
  }
})

// set a ownerID by giving the dbv1Id
app.put('/api/legacyParts/:dbV1Id/owner/:ownerId', /*userMustBeAdmin,*/ async (req :Request, res: Response) => {
  const {dbV1Id, ownerId} = req.params;
  try {
    const user = await User.findOne({_id:ownerId});
    if (user._id.toString() === ownerId) {
      console.log(`assign parts of ${dbV1Id} to ${user.name}`)
      const docs = await Part.updateMany({dbV1Id}, {ownerId});
      res.json({message: `updated ${docs.nModified} of ${docs.n}`, total: docs.n, updated: docs.nModified});
    }
  } catch (err) {
    res.status(404).json(err);
  }
  
})

// ============================static files===================================
app.use('/public', express.static('public'));
// ----------------------------------------------------------------------------
app.listen(8000, (err) => {
  console.log('api server on 8000');
  if (err) console.log(err);
})