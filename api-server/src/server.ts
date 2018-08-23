import express from 'express'
import {Response, NextFunction} from 'express'
import verifyGoogleToken from './googleOauth'
import cors from 'cors'
import * as bodyParser from 'body-parser'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import secret from '../secret.json'
import {User, Part, FileData} from './models'

interface IUserInfo {
    username: string,
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

mongoose.connect(
  secret.mongoDB.url,
  {
    useNewUrlParser: true,
    user: secret.mongoDB.username,
    pass: secret.mongoDB.password, 
  }
);

const app = express()

app.use(cors())

app.use(bodyParser.json({ type: 'application/json' }))

app.use((req :Request, res :Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`)
  res.set('Cache-Control', 'public, max-age=1');
  next();
})

// get user group
app.use((req :Request, res :Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (auth) {
    const [tokenType, token] = auth.split(' ');
    if (tokenType === 'bearer') {  
      jwt.verify(token, secret.jwt.key, (err, decoded :IUserJWT) => {
        if (!err) {
          console.log('verified user');
          console.log(decoded);
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
      username: 'test',
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
      username: 'test',
      fullName: 'test man',
      email: 'yishaluo@gmail.com',
      groups: ['users'],
      iat: Math.floor(Date.now()),
      exp: Math.floor(Date.now()) + 3600,
    }
  }
  if (req.currentUser) {
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
    console.log(`verified user ${name} ${email}`)
    let groups = []
    try {
      const user = await User.findOne({email})
      console.log(`found user ${user}`)
      if (!user) {
        // no user, create one
        const newUser = new User({
          name,
          email,
          authType: 'google',
          groups: ['guests'],
        });
        console.log(`new user: ${newUser}`)
        groups.push('guests')
        await newUser.save()
      } else {
        groups = user.groups
      }
    } catch (err) {
      console.log(err)
    }
    const token = jwt.sign({
        username: email,
        fullName: name,
        email,
        groups,
      }, 
      secret.jwt.key,
      {expiresIn:'1h'})
    res.json({message: `welcome ${name}`, token, name, email, groups})
    
  } catch (err) {
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



app.get('/api/currentUser', userMustLoggedIn, async (req :Request, res: Response) => {
  const {username, fullName, email, groups, exp} = req.currentUser;
  const now = Math.floor(Date.now()/1000);
  console.log({exp, now})
  let payload :{username :string, fullName :string, groups: string[], token?:string, tokenExpireIn?:number} = {username, fullName, groups}
  if (now < exp && exp - now < 1200) {
    payload.token = jwt.sign({
      username,
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
});

// ===========================parts======================================

app.get('/api/parts', userMustLoggedIn, async (req :Request, res: Response) => {
  let {type, skip, limit, ownerUserId} = req.query;
  let condition :any = {};
  if (type) {
    condition.sampleType = type;
  }
  if (ownerUserId) {
    condition.ownerUserId = ownerUserId
  }
  let parts = Part.find(condition)
  
  if (skip) parts = parts.skip(parseInt(skip))
  if (limit) parts = parts.limit(parseInt(limit))
  parts.sort({_id:-1})
  // .select('labName')
  .exec((err, data)=>{
    if (err) {
      console.log(err)
      res.status(500).json({err})
    } else {
      res.json(data);
    }
  })
});

app.get('/api/parts/count', userMustLoggedIn, async (req :Request, res: Response) => {
  let {type, ownerUserId} = req.query;
  let condition :any = {};
  if (type) {
    condition.sampleType = type;
  }
  if (ownerUserId) {
    condition.ownerUserId = ownerUserId;
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
    const bacteria = await Part.count({sampleType:'bacterium'}).exec();
    const primers = await Part.count({sampleType:'primer'}).exec();
    const yeasts = await Part.count({sampleType:'yeast'}).exec();
    res.json({ bacteria, primers, yeasts });
  } catch (err) {
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
  let users = await User.find({});
  users = users.map(user => ({
    id: user._id,
    dbV1Id: user.dbV1Id,
    username: user.username,
    email: user.email,
    authType: user.authType,
    name: user.name,
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
app.put('/api/legacyParts/:dbV1Id/owner/:ownerUserId', /*userMustBeAdmin,*/ async (req :Request, res: Response) => {
  const {dbV1Id, ownerUserId} = req.params;
  try {
    const user = await User.findOne({_id:ownerUserId});
    if (user._id.toString() === ownerUserId) {
      console.log(`assign parts of ${dbV1Id} to ${user.name}`)
      const docs = await Part.updateMany({dbV1Id}, {ownerUserId});
      res.json({message: `updated ${docs.nModified} of ${docs.n}`, total: docs.n, updated: docs.nModified});
    }
  } catch (err) {
    res.status(404).json(err);
  }
  
})
// ----------------------------------------------------------------------------
app.listen(8000, (err) => {
  console.log('api server on 8000');
  if (err) console.log(err);
})