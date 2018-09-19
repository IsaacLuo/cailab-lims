import mongoose from 'mongoose'
import {Schema} from 'mongoose'

export const UserSchema = new Schema({
  dbV1:{
    id: Number,
    admin:Boolean,
    canEdit:Boolean,
    approved:Boolean,
    signInCount: Number,
  },
  email: String,
  authType: String,
  passwordHash: String,
  passwordSalt: String,
  name: String,
  abbr: String,
  groups: [String],
  createdAt: Date,
  updatedAt: Date,
});

export const User = mongoose.model('User', UserSchema);

export const PartSchema = new Schema({
  labName: String,
  labPrefix: String,
  labId: Number,
  personalPrefix: String,
  personalId: Number,
  personalName: String,
  ownerId: Schema.Types.ObjectId,
  ownerName: String,
  sampleType: String,
  comment: String,
  createdAt: Date,
  updatedAt: Date,
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
  attachments: [{
    fileName: String,
    contentType: String,
    fileSize: Number,
    fileId: Schema.Types.ObjectId,
  }],
  container: {
    type: String,
    barcode: String,
  },
  dbV1:{
    id: Number,
    userId: Number,
  },
  history: Schema.Types.Mixed,
});

export const Part = mongoose.model('Part', PartSchema);

export const FileData = mongoose.model('FileData', {
  name: String,
  data: Buffer,
});

export const PartsIdCounter = mongoose.model('PartsIdCounter', {
  name: String,
  count: Number,
});

export const LogLogin = mongoose.model('LogLogin', {
  operatorId: Schema.Types.ObjectId,
  operatorName: String,
  type: String,
  sourceIP: String,
  timeStamp: Date,
});

export const LogOperation = mongoose.model('LogOperation', {
  operatorId: Schema.Types.ObjectId,
  operatorName: String,
  type: String,
  level: Number,
  sourceIP: String,
  timeStamp: Date,
  data: Schema.Types.Mixed,
});

export const PartDeletionRequest = mongoose.model('PartDeletionRequest', {
  senderId: Schema.Types.ObjectId,
  senderName: String,
  partId: Schema.Types.ObjectId,
  requestedCount: Number,
  requestedAt: [Date],
});