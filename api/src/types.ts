import koa from 'koa';
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

