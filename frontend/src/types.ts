import {History, Location} from 'history' 

// interface of all actions
export interface IAction {
  type: string,
  data: any,
}


interface IPartsCount {
  bacteria: number,
  primers: number,
  yeasts: number,
}

export interface IBasket {
  _id: string, 
  createAt: Date,
  updatedAt: Date,
  partsCount: number,
  name: string,
  parts: any[],
}

export interface IUserState {
  // ===user state controls===
  loggedIn: boolean,
  userId: string,
  fullName: string,
  profilePicture?: string,
  groups: string[],
  barcode: string,
}

export interface IAppState {
  // the app is initializing(fetching data from server first time)
  initializing: boolean,
  // ===dialogs visible controls===
  loginDialogVisible: boolean,
  newPartDialogVisible: boolean,
  editPartDialogVisible: boolean,
  // all user names, used in user filter combo box
  allUsers: IUserInfo[],
}

export interface IPartListState {
  currentBasket?: IBasket,
}

export interface IBasketState {
  currentBasket?: IBasket,
  basketList: IBasket[],
  defaultBasketId:string,
}

export interface IStoreState {

  app: IAppState,
  user: IUserState,
  partList: IPartListState,
  basket: IBasketState,

  // parts information
  partsCount: IPartsCount,

  // edit dialog information  
  editPartDialogPartId: string,

}

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

export interface IPartListRowData {
  _id: string,
  labName: string,
  personalName: string,
  tags: string,
  hostStrain?: string,
  markers?: string,
  date?: string,
  comment?: string,
  ownerId?: string,
  ownerName?: string,
  createdAt?: string,
  attachments?: IAttachment[],
  sequence?: string,
  orientation?: string,
  meltingTemperature?: string,
  concentration?: string,
  vendor?: string,
  parents?: string,
  genotype?: string,
  plasmidType?: string,
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