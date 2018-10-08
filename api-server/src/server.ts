import express from 'express'
import {Response, NextFunction} from 'express'
import verifyGoogleToken from './googleOauth'

import jwt from 'jsonwebtoken'

import secret from '../secret.json'
import {User, Part, FileData, PartsIdCounter, PartDeletionRequest, LogLogin, LogOperation} from './models'
import multer from 'multer'

import {Request} from './MyRequest'
import {userMustLoggedIn, userMustBeAdmin} from './MyMiddleWare'

// other processors

import preprocess from './preprocess'
import handlePart from './rest/part'
import handlePartDeletion from './rest/sudoRequests/partDeletion'
import handleAttachments from './rest/attachment';
// ============================================================================
console.info(`running in ${process.env.NODE_ENV}`)

const app = express();
const upload = multer();
// enable CORS, parse body, set req.currentUser etc.
preprocess(app);

// CURD and count parts
handlePart(app);

// CRD part deletion requests from normal user to admins.
handlePartDeletion(app);

// CRD attachments of parts
handleAttachments(app, upload);


// for testing if the server is running
app.get('/test/',(req :Request, res: Response) => {
  res.json({foo:'get'})
})

// use google auth
// request:
//     body: {token: the token string from google}
// response: 
//     {id: unique user id in db,
//      token: a jwt token
//      name: user's fulll name
//      email: user's email
//      groups: can be one or more of "guests, users, administrators, visitors"}
app.post('/api/googleAuth/', async (req :Request, res: Response) => {
  try {
    const {name, email} = await verifyGoogleToken(req.body.token);
    const abbr = name.trim().split(' ').map(v=>v[0]).join('').toUpperCase();
    let groups = []
      const user = await User.findOne({email})
      let id = '';
      if (!user) {
        // no user, create one in db
        const newUser = new User({
          name,
          email,
          abbr,
          authType: 'google',
          groups: ['guests'],
          createdAt: new Date(),
        });
        groups.push('guests')
        await newUser.save();
        id = newUser.id;
        // log to database
        LogLogin.create({
          operatorId: id,
          operatorName: name,
          type: 'register',
          sourceIP: req.ip,
          timeStamp: new Date(),
        });
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
    // log to database
    LogLogin.create({
      operatorId: id,
      operatorName: name,
      type: 'login',
      sourceIP: req.ip,
      timeStamp: new Date(),
    });
    res.json({message: `welcome ${name}`, id, token, name, email, groups})
    
  } catch (err) {
    req.log.error(err);
    res.status(401).json({message: err})
  }
})

// get user names
// response: [{name: user's full name, id: unique user id in db}]
app.get('/api/users/names/', userMustLoggedIn, async (req :Request, res: Response) => {
  let users = await User.find({groups:'users'});
  users = users.map(user => ({
    name: user.name,
    id: user.id,
  }));
  res.json(users);
});

// get current user information, it can also be used for refreshing jwt tokens
// response:
//   {id: unique user id in db,
//   fullName: user's full name or 'guest'
//   email: user's email or undefined
//   groups: can be one or more of "guests, users, administrators, visitors"
//   token: a new jwt token, appears only if current token is going to be expired soon}
app.get('/api/currentUser', async (req :Request, res: Response) => 
{ 
  if (req.currentUser) {
  const {id, fullName, email, groups, exp} = req.currentUser;
  const now = Math.floor(Date.now()/1000);
  req.log.debug({exp, now});
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
app.get('/api/statistic', async (req :Request, res: Response) => {
  try {
    const ret:any = {};
    ret.count = {};
    ret.count.bacteria = await Part.countDocuments({sampleType:'bacterium'}).exec();
    ret.count.primers = await Part.countDocuments({sampleType:'primer'}).exec();
    ret.count.yeasts = await Part.countDocuments({sampleType:'yeast'}).exec();
    ret.monthlyStatistic = await Part.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now()-365*24*3600000),
          }
        }
      }, {
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
    const user = await User.findOne({email}).exec();
    const originalUserInfo = JSON.parse(JSON.stringify(user));
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
      await user.save();
      // log
      LogOperation.create({
        operatorId: req.currentUser.id,
        operatorName: req.currentUser.fullName,
        type: 'change privilege',
        level: 5,
        sourceIP: req.ip,
        timeStamp: new Date(),
        data: {
          originalUserInfo,
          newUserInfo: user,
        },
      });
      res.json({message:'OK'});   
    } else {
      res.status(404).json({message: 'user not found'})
    }
  } catch (err) {
    res.status(404).json({message: 'user not found', err})
  }
})

// set a ownerID by giving the dbv1Id
// app.put('/api/legacyParts/:dbV1Id/owner/:ownerId', /*userMustBeAdmin,*/ async (req :Request, res: Response) => {
//   const {dbV1Id, ownerId} = req.params;
//   try {
//     const user = await User.findOne({_id:ownerId});
//     if (user._id.toString() === ownerId) {
//       console.log(`assign parts of ${dbV1Id} to ${user.name}`)
//       const docs = await Part.updateMany({dbV1Id}, {ownerId});
//       res.json({message: `updated ${docs.nModified} of ${docs.n}`, total: docs.n, updated: docs.nModified});
//     }
//   } catch (err) {
//     res.status(404).json(err);
//   }
// })

// ============================static files===================================
app.use('/public', express.static('public'));
app.use('/', express.static('../frontend/build'));
// ----------------------------------------------------------------------------
app.listen(8000, (err) => {
  console.info('api server on 8000');
  if (err) console.error(err);
})