export interface IPart {
  labName: string,
  labPrefix: string,
  labId: number,
  personalPrefix: string,
  personalId: number,
  personalName: string,
  ownerUserId?: string,
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
  meltingTemperature?: string,
  concentration?: string,
  vendor?: string,
  attachments?: string[],
  customData?: any,
}