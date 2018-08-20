import mongoose from 'mongoose'
import {Schema} from 'mongoose'

import secret from '../../secret.json'
import {Part, FileData} from '../models'
import yeasts from './yeasts.json'
// import bacteria from './bacteria.json'
import primers from './primers.json'
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

function removeNullElement(arr :string[]) :string[] {
  let re = []
  for(const item of arr) {
    if (item !== null) {
      re.push(item)
    }
  }
  return re
}

let mission = 0;
let finished = 0;

async function loadYeasts() {
  for (const yeast of yeasts) {
    mission++;
    let x = new Part({
      labName: yeast.labName,
      personalName: yeast.personalName,
      dbV1Id: yeast.dbV1Id,
      sampleType: yeast.sampleType,
      comment: yeast.comments,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      date: yeast.date,
      tags: removeNullElement(yeast.tags),
      content: {
        parents: removeNullElement(yeast.parents),
        genotype: removeNullElement(yeast.genotype),
        plasmidType: yeast.plasmidType,
        markers: removeNullElement(yeast.markers),
      }
    });
    await x.save();
    finished++;
    process.stdout.write(`${finished}/${mission}\r`);
  }
}

interface Attachment {
  fileName: string,
  contentType: string,
  fileSize: number,
  fileId: ObjectId,
}

function loadBateria() {
  // for (const bacterium of bacteria) {
  const file = fs.createReadStream('./bacteria.txt');
  const readLine = readline.createInterface({
    input: file,
  })
  readLine.on('line', async line => {
    {
      mission++;
      const bacterium = JSON.parse(line);
      let attachment :null|Attachment[] = null;
      if(bacterium.attachment && bacterium.attachment.data) {
        const fileData = Buffer.from(bacterium.attachment.data, 'base64')
        const file = await FileData.create({
          name: bacterium.attachment.fileName,
          data: fileData,
        });
        attachment = [{
          fileName: bacterium.attachment.fileName,
          contentType: bacterium.attachment.contentType,
          fileSize: bacterium.attachment.size,
          fileId: file._id as ObjectId,
        }];
      }
      let x = new Part({
        labName: bacterium.labName,
        personalName: bacterium.personalName,
        dbV1Id: bacterium.dbV1Id,
        sampleType: bacterium.sampleType,
        comment: bacterium.comments,
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        date: bacterium.date,
        tags: removeNullElement(bacterium.tags),
        content: {
          plasmidName: bacterium.plasmidName,
          hostStrain: bacterium.hostStrain,
          markers: removeNullElement(bacterium.markers),
        },
        attachment,
      });
      await x.save()
      finished++;
      process.stdout.write(`${finished}/${mission}\r`);
    }
  })
}

async function loadPrimers() {
  for (const primer of primers) {
    mission++;
    let x = new Part({
      labName: primer.labName,
      personalName: primer.personalName,
      dbV1Id: primer.dbV1Id,
      sampleType: primer.sampleType,
      comment: primer.comments,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      date: primer.date,
      tags: [],
      content: {
        description: primer.description,
        sequence: primer.sequence,
        orientation: primer.orientation,
        meltingTemperature: primer.meltingTemperature,
        concentration: primer.concentration,
        vendor: primer.vendor,
      }
    });
    await x.save()
      finished++;
      process.stdout.write(`${finished}/${mission}\r`);
  }
}
console.log('start');
console.log('bacteria');
await loadBateria()
console.log('yeasts');
await loadYeasts()
console.log('primers');
await loadPrimers()

// mongoose.disconnect();

console.log('finish');