import mongoose from 'mongoose'
import {Schema} from 'mongoose'

import secret from '../../secret.json'
import {Part} from '../models'

type ObjectId = Schema.Types.ObjectId;

mongoose.connect(
  secret.mongoDB.url,
  {
    useNewUrlParser: true,
    user: secret.mongoDB.username,
    pass: secret.mongoDB.password, 
  }
);


async function main() {
  let count = 0;
  try {
  const parts = await Part.find({}).exec();
  for(const part of parts) {
    // process.stdout.write(`${count++}. ${part.labName}\r`);
    const markers = part.content.markers;
    const newMarkers = new Set();
    if (markers) {
      for (let marker of markers) {
        if (/\W+$/.test(marker)) {
          console.log(`${part.labName}: ${marker}`);
        }
      }
    }
  }
  mongoose.disconnect();
} catch (err) {
  req.log.error(err);
}

}
console.log('start');
main();