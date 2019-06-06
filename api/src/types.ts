import koa from 'koa';
import { Logger } from 'log4js';
import { Schema } from 'mongoose';
export type Ctx = koa.ParameterizedContext<ICustomState, {}>;
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
  abbr: string,
  createdAt?: Date,
  updatedAt?: Date,
  barcode: string,
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
  ownerId?: string,
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
  attachments?: [{
    fileName: string,
    contentType: string,
    fileSize: number,
    fileId: string,
}],
  container?: {
    type: string,
    barcode: string,
  },
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
    location:  string|Schema.Types.ObjectId|ILocation,
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