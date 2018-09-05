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


  const labPrefix = 'XXXX';
  const doc = await PartsIdCounter.findOneAndUpdate({name:labPrefix}, {$inc:{count:1}}, {new: true, upsert: true}).exec();
  console.log(doc);
  // const x = await PartsIdCounter.findOne({_id:'15b8fe1c7a1e1c63a6c527456'}).exec();
  // console.log(x);

  mongoose.disconnect();
}
main();
