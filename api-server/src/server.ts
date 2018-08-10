import express from 'express'
import {Request, Response, NextFunction} from 'express'
import verifyGoogleToken from './googleOauth'
import cors from 'cors'
import * as bodyParser from 'body-parser'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import secret from '../secret.json'
import {User} from './models'

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
  next();
})

app.get('/test/',(req :Request, res: Response) => {
  res.json({foo:'get'})
})

app.post('/api/googleAuth/', async (req :Request, res: Response) => {
  try {
    console.log(req.body)
    const {name, email} = await verifyGoogleToken(req.body.token);
    console.log(`verified user ${name} ${email}`)
    try {
      const user = await User.findOne({email})
      console.log(`found user ${user}`)
      if (!user) {
        // no user, create one
        const newUser = new User({
          name,
          email,
          authType: 'google',
          group: ['guests'],
        });
        console.log(`new user: ${newUser}`)
        await newUser.save()
      }
    } catch (err) {
      console.log(err)
    }
    const token = jwt.sign({
        user:email,
        name,
      }, 
      secret.jwt.key,
      {expiresIn:'1h'})
    res.json({message: `welcome ${name}`, token,})
    
  } catch (err) {
    res.status(401).json({message: err})
  }
})

app.listen(8000, (err) => {
  console.log('api server on 8000');
  if (err) console.log(err);
})