import mongoose from 'mongoose'
import secret from '../../secret.json'
import {Part} from '../models'
import yeasts from './yeasts.json'

mongoose.connect(
  secret.mongoDB.url,
  {
    useNewUrlParser: true,
    user: secret.mongoDB.username,
    pass: secret.mongoDB.password, 
  }
);

for (const yeast of yeasts) {
  console.log('>>>'+yeast.comments);
  let x = new Part(yeast);
  x.save();
}

console.log('finish');