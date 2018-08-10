import express from 'express'
import {Request, Response, NextFunction} from 'express'
import verifyGoogleToken from './googleOauth'
import cors from 'cors'
import * as bodyParser from 'body-parser'

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
    res.json({message: `welcome ${name}`})
  } catch (err) {
    res.status(401).json({message: err})
  }
})

app.listen(8000, (err) => {
  console.log('api server on 8000');
  if (err) console.log(err);
})