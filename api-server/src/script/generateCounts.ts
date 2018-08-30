import mongoose from 'mongoose'
import {Schema} from 'mongoose'

import secret from '../../secret.json'
import {Part, FileData, PartsIdCounter} from '../models'
import fs from 'fs'
import readline from 'readline'

type ObjectId = Schema.Types.ObjectId;

mongoose.connect(
  secret.mongoDB.url,
  {
    useNewUrlParser: true,
    user: secret.mongoDB.username,
    pass: secret.mongoDB.password, 
  }
);
let countDict = {};
function recordCount(name: string, id: string) {
  const idNumber = parseInt(id);
  if(countDict[name] === undefined) countDict[name] = 0;
  if(countDict[name] < idNumber) {
    countDict[name] = idNumber;
  }
}

async function main() {
  // await PartsIdCounter.deleteMany({}).exec();
  const parts = await Part.find({}).exec();
  console.log(parts.length);
  for(const part of parts) {
    recordCount(part.labPrefix, part.labId);
    recordCount(part.personalPrefix, part.personalId);
  }
  console.log(countDict);
    for(const key of Object.keys(countDict)) {
      console.log(key, countDict[key]);
      await (new PartsIdCounter({name: key, count: countDict[key]})).save();
    }
  }
main();