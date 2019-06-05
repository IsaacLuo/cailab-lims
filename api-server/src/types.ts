export interface IGLobalConfig {
  maxTubeDeleteLimit: number,
  host: string,
  port: number,
  publicURL?: string,
}

export interface IAttachment {
    fileName: string,
    contentType: string,
    fileSize: number,
    fileId: string,
}

export interface IPart {
  _id?:string,
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

export interface IPartFormAttachment {
  fileId?:string,
  fileName?:string,
  contentType?:string,
  fileSize?:number,
  content?:string,
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

export interface IUser {
  _id: any,
  email: string,
  authType: string, // 'logal' or 'google'
  name: string, // user's full name
  abbr: string, // user's initial letters of full name
  groups: string[], // array of group name, 'guest', 'users', 'visitors', or 'administrators'
  createdAt: Date,
  updatedAt: Date,
  barcode: string,
  defaultBasketId: string,
  dbV1?:any,
  passwordHash?: string, // empty if user signed up using google account
  passwordSalt?: string, // empty if user signed up using google account
}

export interface IComment {
  createdAt: Date,
  creator: any,
  creatorName: String,
  text: String,
  attachments: any[],
}

export interface IPartComment {
  part: any;
  comments: IComment[],
}