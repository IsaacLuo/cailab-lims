import {History, Location} from 'history' 

export interface IUserInfo {
  id: string,
  name: string,
  email: string,
}

export interface IPart {
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
  tags?: [string],
  content?: {
    // primers only
    description?: string,
    sequence?: string,
    orientation?: string,
    meltingTemperature?: number,
    concentration?: string,
    vendor?: string,
    
    // bacteria only
    plasmidName?: string,
    hostStrain?: string,

    // yeasts only
    parents?: string[],
    genotype?: string[],
    plasmidType?: string,

    // bacteria and yeasts
    markers?: string,
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

export interface IColumn {
  label: string,
  prop: string,
  width?: number,
  minWidth?: number,
  sortable?: boolean|string,
  fixed? : boolean | string,
  render?: (data:any, column:any, index:number) => void,
}

export interface IAttachment {
  name: string,
  size: number,
  type: string,
  content: string,
}

export interface IReactRouterProps {
  history: History,
  location: Location,
}