import mongoose from 'mongoose'
import {Schema} from 'mongoose'

import secret from '../../secret.json'
import {Part, FileData, PartsIdCounter} from '../models'
import fs from 'fs'
import readline from 'readline'

type ObjectId = Schema.Types.ObjectId;



async function main() {
  mongoose.connect(
    secret.mongoDB.url,
    {
      useNewUrlParser: true,
      user: secret.mongoDB.username,
      pass: secret.mongoDB.password, 
    }
  );


  
  mongoose.disconnect();
}
main();
