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

let countDict = {};
function recordCount(name: string, id: string) {
  const idNumber = parseInt(id);
  if(countDict[name] === undefined) countDict[name] = 0;
  if(countDict[name] < idNumber) {
    countDict[name] = idNumber;
  }
}

function loadYeasts() {
  const file = fs.createReadStream('./yeasts.txt');
  const readLine = readline.createInterface({
    input: file,
  })
  readLine.on('line', async line => {
    mission++;
    const yeast = JSON.parse(line);
    const [labName, labPrefix, labId] = /([A-Za-z]+)(\d+)(.*)/.exec(yeast.labName);
    const [personalName, personalPrefix, personalId] = /([A-Za-z]+)(\d+)(.*)/.exec(yeast.personalName);
    let date = yeast.date;
    if (!date || new Date(date) < new Date('1989-01-01T00:00:00.000Z')) {
      date = yeast.createdAt;
    }

    let x = new Part({
      labName: yeast.labName,
      labPrefix,
      labId,
      personalName: yeast.personalName,
      personalPrefix,
      personalId,
      dbV1Id: yeast.userId,
      sampleType: yeast.sampleType,
      comment: yeast.comment,
      createdAt: yeast.createdAt,
      updatedAt: yeast.updatedAt,
      date,
      tags: removeNullElement(yeast.tags),
      content: {
        parents: removeNullElement(yeast.parents),
        genotype: removeNullElement(yeast.genotype),
        plasmidType: yeast.plasmidType,
        markers: removeNullElement(yeast.markers),
      }
    });
    await x.save();
    recordCount(labPrefix, labId);
    recordCount(personalPrefix, personalId);
    finished++;
    process.stdout.write(`${finished}/${mission}\r`);
  })
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

      const [labName, labPrefix, labId] = /([A-Za-z]+)(\d+)(.*)/.exec(bacterium.labName);
      const [personalName, personalPrefix, personalId] = /([A-Za-z]+)(\d+)(.*)/.exec(bacterium.personalName);
    
      let date = bacterium.date;
      if (!date || new Date(date) < new Date('1989-01-01T00:00:00.000Z')) {
        date = bacterium.createdAt;
      }

      let x = new Part({
        labName: bacterium.labName,
        labPrefix,
        labId,
        personalName: bacterium.personalName,
        personalPrefix,
        personalId,
        dbV1Id: bacterium.userId,
        sampleType: bacterium.sampleType,
        comment: bacterium.comment,
        createdAt: bacterium.createdAt,
        updatedAt: bacterium.updatedAt,
        date,
        tags: removeNullElement(bacterium.tags),
        content: {
          plasmidName: bacterium.plasmidName,
          hostStrain: bacterium.hostStrain,
          markers: removeNullElement(bacterium.markers),
        },
        attachment,
      });
      await x.save()
      recordCount(labPrefix, labId);
      recordCount(personalPrefix, personalId);
      finished++;
      process.stdout.write(`${finished}/${mission}\r`);
    }
  })
}

function loadPrimers() {
  const file = fs.createReadStream('./primers.txt');
  const readLine = readline.createInterface({
    input: file,
  })
  readLine.on('line', async line => {
      mission++;
      const primer = JSON.parse(line);
    const [labName, labPrefix, labId] = /([A-Za-z]+)(\d+)(.*)/.exec(primer.labName);
    const [personalName, personalPrefix, personalId] = /([A-Za-z]+)(\d+)(.*)/.exec(primer.personalName);
    
    let date = primer.date;
    if (!date || new Date(date) < new Date('1989-01-01T00:00:00.000Z')) {
      console.log(date, '->', primer.createdAt);
      date = primer.createdAt;
    }

    let x = new Part({
      labName: primer.labName,
      labPrefix,
      labId,
      personalName: primer.personalName,
      personalPrefix,
      personalId,
      dbV1Id: primer.userId,
      sampleType: primer.sampleType,
      comment: primer.comment,
      createdAt: primer.createdAt,
      updatedAt: primer.updatedAt,
      date,
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
    recordCount(labPrefix, labId);
    recordCount(personalPrefix, personalId);
      finished++;
      process.stdout.write(`${finished}/${mission}\r`);
  })
}
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {

console.log('start');
console.log('cleaning');
await Part.deleteMany({}).exec();
await FileData.deleteMany({}).exec();
console.log('bacteria');
loadBateria();
do {
  await sleep(1000);
} while (finished < mission);

console.log('yeasts');
loadYeasts()
do {
  await sleep(1000);
} while (finished < mission);

console.log('primers');
loadPrimers()

do {
  await sleep(1000);
} while (finished < mission);

// mongoose.disconnect();
await PartsIdCounter.deleteMany({}).exec();
for(const key of Object.keys(countDict)) {
  console.log(key, countDict[key]);
  await (new PartsIdCounter({name: key, count: countDict[key]})).save();
}

console.log('finish');

mongoose.disconnect();

}

main();