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
  name: string,
  email: string,
  profilePicture?: string,
  groups: string[],
  barcode: string,
  token: string,
  tokenRefreshTime: Date,
}

export interface IAppState {
  // the app is initializing(fetching data from server first time)
  initializing: boolean,
  // ===dialogs visible controls===
  loginDialogVisible: boolean,
  newPartDialogVisible: boolean,
  editPartDialogVisible: boolean,
  // edit dialog information  
  editPartDialogPartId: string,
  // all user names, used in user filter combo box
  allUsers: IUserInfo[],
}

export interface IPartListState {
  currentBasket?: IBasket,
  loading: boolean,
  sampleType: string,
  searchKeyword: string,
  userFilter: string,
  skip: number,
  limit: number,
  total: number,
  sortMethod: {
    order: 'asc'|'desc',
    prop: string,
  },
  parts: IPart[],
}

export interface IBasketState {
  currentBasket?: IBasket,
  basketList: IBasket[],
  defaultBasketId:string,
}

export interface IStoreState {

  app: IAppState,
  user: IUserState,
  loginDialog: ILoginDialogState,
  partList: IPartListState,
  basket: IBasketState,

  // parts information
  partsCount: IPartsCount,

  // assigne tubes
  assignTubes: IAssignTubesState,

  // searchTube
  searchTubeBarcode: ISearchTubeBarcodeState,

  // searchRack
  searchRackBarcode: ISearchRackBarcodeState,

  // part
  part: IPartState,

  // containers
  container: IContainerState,

  discussion: IDiscussionState,

}

export interface IUserInfo {
  _id: string,
  name: string,
  email: string,
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
  dbV1?: any,
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
    name: string,
    contentType: string,
    size: number,
    file: string,
  }],
  containers?: IContainer[],
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
  align?: string,
  headerAlign?: string,
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
  match: {
    params: any,
    path: string,
    url: string,
  }
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

export interface IAssignTubesState {
  basketContent: IPart[],
}

export interface ISearchTubeBarcodeState {
  message: string,
  // part?: IPart,
  tube?: ITube,
}

export interface ITube {
  _id?: string,
  barcode: string,
  wellId: number,
  wellName: string,
  part?: IPart,
}

export interface ISearchRackBarcodeState {
  message: string,
  tubes: ITube[],
}

export interface IPartState {
  part?: IPart,
  message: string,
}

export interface IContainerState {
  containers: IContainer[],
  skip: number,
  limit: number,
  total: number,
  loading: boolean,
}

export interface ILoginDialogState {
  busy: boolean,
}

export interface IDiscussionState {
  comments: any,
  newCommentText: string,
}

export interface IExpandedPanel {
  type: string,
  expandPannel?: (data:any) => JSX.Element,
}

export interface IContainer {
  _id?: string,
  ctype: string,
  barcode: string,
  assignedAt: Date,
  parentContainer?: string,
  locationBarcode?: string,
  currentStatus: string,
  submitStatus?: 'pending' | 'verified' | 'failed' | 'deleting',
}

export interface IComment {
  part: string | IPart,
  text: string,
  attachments: string[],
  author: string | IUserInfo,
  createdAt: Date,
  reference: string | IComment,

}