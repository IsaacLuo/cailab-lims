import koa, { DefaultContext } from 'koa';
import { Logger } from 'log4js';
import { Schema } from 'mongoose';
import {
  IUserModel, IPartModel,
} from './models';

export type Ctx = koa.ParameterizedContext<ICustomState, DefaultContext>;
export type Next = ()=>Promise<any>;

export interface IGLobalConfig {
  maxTubeDeleteLimit: number,
  host: string,
  port: number,
  publicURL?: string,
}

export interface IUserEssential {
  _id: any,
  email: string,
  name: string, // user's full name
  groups: string[], // array of group name, 'guest', 'users', 'visitors', or 'administrators'
}

export interface ITokenContent extends IUserEssential{
  iat:number,
  exp:number,
}

export interface IUser extends IUserEssential {
  createdAt?: Date,
  updatedAt?: Date,
  barcode: string,
  abbr:string,
  defaultPickList: string,
}

export interface ILogLogin {
  operator: any,
  operatorName: string,
  type: string,
  sourceIP: string,
  timeStamp: Date,
}

export interface ICustomState {
  user?: ITokenContent,
  data?: any,
  userToken: string,
  logger: Logger,
}

export interface IPart {
  // _id?: any,
  labName: string,
  labPrefix: string,
  labId: number,
  personalPrefix: string,
  personalId: number,
  personalName: string,
  owner?: string|IUser,
  sampleType?: string,
  comment?: string,
  createdAt: Date,
  updatedAt: Date,
  date?: Date, 
  tags?: string[],
  content?: {
    // primers only
    description?: string,
    sequence?: string,
    orientation?: string,
    meltingTemperature?: number,
    concentration?: string,
    vendor?: string,
    
    // bacteria only
    hostStrain?: string,

    // yeasts only
    parents?: string[],
    genotype?: string[],
    plasmidType?: string,

    // bacteria and yeasts
    plasmidName?: string,
    markers?: string[],
    // all
    customData?: any,
  },
  attachments?: IAttachment[],
  containers?: Array<string|IContainer|Schema.Types.ObjectId>,
  history: string|Schema.Types.ObjectId|IPartHistory,
}

export interface IAttachment {
    name: string,
    contentType: string,
    size: number,
    file: string|Schema.Types.ObjectId|IFileData,
}

export interface IFileData {
  name: string,   // original file name, 
  contentType: string,  // MIME type
  size: number,   // bytes
  data: Buffer,   // data in binary
}

export interface ILocation {
  barcode: string,
  description: string,
}

export interface IContainer {
  ctype: string,  //'tube'|'well'
  barcode: string,
  createdAt: Date,
  assignedAt: Date,
  operator: string|Schema.Types.ObjectId|IUser,
  part: string|Schema.Types.ObjectId|IPart,
  parentContainer: string|Schema.Types.ObjectId|IContainerGroup,
  wellId: number,
  wellName: string,
  location: string|Schema.Types.ObjectId|ILocation,
  verifiedAt: Date,
  locationHistory: Array<{
    location:  any,
    verifiedAt: Date,
  }>,
  currentStatus: String,
}

export interface IContainerGroup {
  ctype: string, //'plate'|'rack'
  barcode: string,
  createdAt: Date,
  verifiedAt: Date,
  currentStatus: string,
  location: string|Schema.Types.ObjectId|ILocation,

  locationHistory:Array<{
    location:  string|Schema.Types.ObjectId|ILocation,
    verifiedAt: Date,
  }>,
}

export interface IPartHistory {
  partId: string,
  histories: any,
}

export interface IPartForm {
  sampleType?: string,
  comment?: string,
  date?: Date,
  tags?: string[],
  markers?: string[],
  plasmidName?: string,
  hostStrain?: string,
  parents?: string[],
  genotype?: string[],
  plasmidType?: string,
  sequence?: string,
  orientation?: string,
  meltingTemperature?: number,
  concentration?: string,
  vendor?: string,
  attachments?: IPartFormAttachment[],
  customData?: any,
}

export interface IPartFormAttachment {
  fileId?:string,
  fileName?:string,
  contentType?:string,
  fileSize?:number,
  content?:string,
}

export interface ILocation {
  barcode: string,
  description: string,
}

export interface IPersonalPickList {
  name: string;
  owner: string|IUserModel|IUser,
  createdAt: Date,
  updatedAt: Date,
  parts: Array<string|IPartModel|IPart>,
  partsCount: number,
  default: boolean,
}

export interface IRackScannerRecord {
  createdAt: Date,
  rackBarcode: String,
  tubes: ITubesInRackScannerRecord[],
}

export interface ITubesInRackScannerRecord {
  wellName: string,
  wellId: number,
  barcode: string,
}