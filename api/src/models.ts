import { 
  IUser,
  ILogLogin,
  IPart,
} from './types';
import mongoose, { Model, Document } from 'mongoose'
import {Schema} from 'mongoose'

export const UserSchema = new Schema({
  email: String,
  name: String, // user's full name
  abbr: String, 
  groups: [String], // array of group name, 'guest', 'users', 'visitors', or 'administrators'
  createdAt: Date,
  updatedAt: Date,
  barcode: String,
});

export interface IUserModel extends IUser, Document{}

export const User:Model<IUserModel> = mongoose.model('User', UserSchema, 'users');

export const LogLoginSchema = new Schema({
  operator: {
    type:  Schema.Types.ObjectId,
    ref: 'User',
  },
  operatorName: String,
  type: String,
  sourceIP: String,
  timeStamp: Date,
});

export interface ILogLoginModel extends ILogLogin, Document{}

export const LogLogin:Model<ILogLoginModel> = mongoose.model('LogLogin', LogLoginSchema, 'log_logins');

export const PartSchema = new Schema({
  labName: String,                      // combined "labPrefix" and "labId", e.g. 'YCe1234', redundant information
  labPrefix: String,                    // the first part of labName, e.g. 'YCe'. e means E.coli
  labId: Number,                        // the second part of labName, e.g. 1234, incrementing.
  personalName: String,                 // combined "personalPrefix" and "personalId", e.g. 'YLe123', redundant information
  personalPrefix: String,               // the first part of personalName, e.g. 'YLe', YL is the initial letters of the user's name, e means E.coli 
  personalId: Number,                   // the second part of personalName, e.g. 123, incrementing.
  owner: {                              // the ID of the owner
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  operators: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  ownerName: String,                    // the owner's name, redundant information
  sampleType: String,                   // 'bacterium', 'primer', or 'yeast'
  comment: String,                      // description of this part
  createdAt: Date,                      // database document creation date, generated by the program
  updatedAt: Date,                      // database document updating date, generated by the program
  date: Date,                           // the date of sample creation, not the database document creation date, given by user.
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
    customData: Schema.Types.Mixed,  // any other {key:value} pairs are saved here
  },
  attachments: [{                    
    fileName: String,                // redundant information
    contentType: String,             // redundant information
    fileSize: Number,                // redundant information
    fileId: Schema.Types.ObjectId,   // id in the FileData modal
  }],
  containers: [{
    ctype: String,
    barcode: String,
    assignedAt: Date,
    operatorId: Schema.Types.ObjectId,
  }],
  dbV1:{                             // old id and user id data from the cailab-database-v1, useless in v2
    id: Number,
    userId: Number,
  },
  // history: Schema.Types.Mixed,      // previous version of this part.
  historyId: Schema.Types.ObjectId, // previous version of this part.
});

export interface IPartModel extends IPart, Document{}

export const Part:Model<IPartModel> = mongoose.model('Part', PartSchema, 'parts');

export const PartDeletionRequestSchema = new Schema({
  sender: {
    type:  Schema.Types.ObjectId,
    ref: 'User',
  },
  senderName: String,
  partId: Schema.Types.ObjectId,
  requestedCount: Number,
  requestedAt: [Date],
});

export const PartDeletionRequest = mongoose.model('PartDeletionRequest', PartDeletionRequestSchema, 'part_deletion_requests');