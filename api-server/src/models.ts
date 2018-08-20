import mongoose from 'mongoose'
import {Schema} from 'mongoose'

export const User = mongoose.model('User', {
  dbV1Id: Number,
  username: String,
  email: String,
  authType: String,
  passwordHash: String,
  passwordSalt: String,
  name: String,
  groups: [String],
});

export const Part = mongoose.model('Part', {
  labName: String,
  personalName: String,
  ownerUserId: Schema.Types.ObjectId,
  dbV1Id: Number,
  sampleType: String,
  comment: String,
  createdAt: Date,
  modifiedAt: Date,
  date: Date, 
  tags: [String],
  content: {
    //primers only
    description: String,
    sequence: String,
    orientation: String,
    meltingTemperature: Number,
    concentration: String,
    vendor: String,
    
    //bacteria only
    plasmidName: String,
    hostStrain: String,

    //yeasts only
    parents: [String],
    genotype: [String],
    plasmidType: String,

    //bacteria and yeasts
    markers: [String],
    // all
    customData: Schema.Types.Mixed,
  },
  attachment: [{
    fileName: String,
    contentType: String,
    fileSize: Number,
    fileId: Schema.Types.ObjectId,
  }],
  container: {
    type: String,
    barcode: String,
  },
  history: Schema.Types.Mixed,
});

export const FileData = mongoose.model('FileData', {
  name: String,
  data: Buffer,
});