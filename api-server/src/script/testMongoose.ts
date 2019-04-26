import mongoose from 'mongoose'
import secret from '../../secret.json'
import {Part, FileData} from '../models'

mongoose.connect(
  secret.mongoDB.url,
  {
    useNewUrlParser: true,
    user: secret.mongoDB.username,
    pass: secret.mongoDB.password, 
  }
);

async function test() {
  const file = await FileData.create({
    name: '123',
    data: '123',
  });
  console.log(file);
}

console.log('start');
test();
console.log('finish');