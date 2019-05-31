import * as xlsx from 'xlsx'
import {IPart} from './types'
import { promises } from 'fs';

export function fileSizeHumanReadable(fileSize: number) {
  if (fileSize < 1024) {
    return fileSize + 'B';
  } else if (fileSize < 1024*1024) {
    return Math.round(fileSize/1024) + 'KB';
  } else {
    return Math.round(fileSize/1024/1024) + 'MB';
  }
}

export function toPlural (singular) {
  switch (singular) {
    case 'bacterium':
      return 'bacteria';
    default:
      return singular+'s';
  }
}


// use async/await to wrap file api
export async function readFileAsBuffer(file: Blob) {
  return new Promise((resolve, reject)=> {
    const fileReader = new FileReader();
    fileReader.onload = event => {
      if (event && event.target && (event.target as any).result) {
        resolve((event.target as any).result);
      } else {
        reject(event);
      }
    };
    fileReader.onerror = reject;
    fileReader.readAsArrayBuffer(file);
  })
}

// use async/await to wrap file api
export async function readFileAsDataURL(file: Blob) {
  return new Promise((resolve:(data:string)=>void, reject)=> {
    const fileReader = new FileReader();
    fileReader.onload = event => {
      if (event && event.target && (event.target as any).result) {
        resolve((event.target as any).result as string);
      } else {
        reject(event);
      }
    };
    fileReader.onerror = reject;
    fileReader.readAsDataURL(file);
  })
}

export async function readFileAsBase64(file: Blob) {
  return new Promise(async (resolve:(data:string)=>void, reject)=> {
    const dataURL = await readFileAsDataURL(file);
    const match = /data:(.*);base64,(.*)/.exec(dataURL);
    if (match && match[2]) {
      resolve(match[2]);
    } else {
      reject(dataURL);
    }
  })
}

export async function sleep(time: number) {
  setTimeout(()=>{
    return new Promise((resolve, reject) => {
      resolve();
    })
  },time);
}

function readExcelDateStringOrNumber(data: number|string) {
  if(typeof(data) === 'number') {
      // 25569 is the days of 1970/1/1 - 1900/1/1, 86400000 is the ms of a day
      return new Date((data - 25569)*86400000);
    } else if(typeof(data) === 'string') {
      // this is a string, analyse it as mm/dd/yyyy
      const match = /([0-9]{2})\/([0-9]{2})\/([0-9]{4})/.exec(data);
      if (!match) {
        throw new Error('invalid date format');  
      }
      const [_,d,m,y] = match;
      console.log('dmy', d,m,y);
      return new Date(parseInt(y, 10), parseInt(m, 10)-1, parseInt(d, 10));
    } else {
      throw new Error('invalid date format');
    }
}


function toColStr(col:number) {
  const nums:number[] = [];
  do {
    nums.unshift(col%26 + 65);
    col = Math.floor(col/26) - 1;
  } while(col >= 0);
  return String.fromCharCode.apply(null, nums);
}

export function getTokenIssuedAt(jwtToken: string) {
  const jwtBody = JSON.parse(atob(jwtToken.split('.')[1]));
  return new Date(parseInt(jwtBody.iat,10)*1000);
}

export class PartFormReader {
  public static fromWorkBook(workbook: xlsx.WorkBook) {
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const sizeRef = sheet['!ref']
    if (!sizeRef) {
      throw new Error('unable to read excel file');
    }
    const reexe = /A1:([A-Z]+)(\d+)/.exec(sizeRef);
    if (!(reexe && reexe[1] && reexe[2])) {
      throw new Error('unable to read excel file');
    }
    let cols=0;
    for (let i=0;i<reexe[1].length;i++) {
      cols*=26;
      cols+= (reexe[1].charCodeAt(i) - 64);
    }
    const rows = parseInt(reexe[2],10);
    
    return new PartFormReader(sheet, rows, cols);
    // const parts :IPart[] = [];
    // for (let row = 1; row<rows; row++) {
    //   const labNameReg = /([A-Za-z]+)(\d+)/.exec(loc(row,0));
    //   if (!labNameReg) {
    //     throw new Error('unable to read excel file');
    //   }
    //   const labName = labNameReg[0];
    //   const labPrefix = labNameReg[1];
    //   const labId = parseInt(labNameReg[2]);
  }

  private cols:number = 0;
  private rows:number = 0;
  private sheet: xlsx.Sheet;
  private headers: string[] = [];
  private customHeaders: Set<string> = new Set();

  constructor(sheet: xlsx.Sheet, rows:number, cols:number) {
    // console.debug(sheet, rows, cols);
    this.sheet = sheet;
    this.rows = rows;
    this.cols = cols;
    this.readTableHeaders();
    // console.debug(this.headers);
  }

  public readData() {
    const data:any[] = [];
    console.debug('customData Header', this.customHeaders);
    for(let row=1; row<this.rows; row++) {
      const dataObj:any = {};
      for(let col=0; col<this.cols; col++) {
        const header = this.headers[col];
        const originalData = this.loc(row,col);
        // console.debug(`row ${row}, col ${col},`, originalData);
        if (this.customHeaders.has(header)) {
          if (dataObj.customData === undefined) {
            dataObj.customData = {};
          }
          if (/(^|\s)date($|\s)/.test(header)) {
            dataObj.customData[header] = readExcelDateStringOrNumber(originalData);
          } else {
          dataObj.customData[header] = originalData;
          }
        }
        if (header === 'date') {
          dataObj[header] = readExcelDateStringOrNumber(originalData);
        } else {
          dataObj[header] = originalData;
        }
      }
      dataObj.attachments = [];
      dataObj.labName = '';
      dataObj.personalName = '';
      dataObj.submitStatus = 'ready';
      data.push(dataObj);
    }
    return data;
  }

  public getHeaders() {
    return this.headers;
  }
  public getCustomHeaders() {
    return Array.from(this.customHeaders);
  }

  private readTableHeaders() {
    this.headers = [];
    const headerDict = {
      // primers
      'Sequence': 'sequence',
      'Orientation\r\n(forward/backward)': 'orientation',
      'Melting Temperature\r\n(number only)': 'meltingTemperature',
      'Concentration': 'concentration',
      'Vendor': 'vendor',

      // bacteria
      'Host Strain': 'hostStrain',
      'Bacterial Markers\r\n(semicolon-seperated)': 'markers',

      // yeasts
      'Parents\r\n(semicolon-seperated)': 'parents',
      'Genotype\r\n(semicolon-seperated)': 'genoType',
      'Plasmid Type': 'plasmidType',

      // common
      'Plasmid Name': 'plasmidName',
      'tags\r\n(semicolon-seperated)': 'tags',
      'Other Names\r\n(semicolon-seperated)': 'tags',
      'Description or Comment': 'comment',
      'Date\r\n(DD/MM/YYYY)': 'date',
      
      // plate info
      'Plate Barcode': 'plateBarcode',
      'Well ID': 'wellId',
      'Tube Barcode': 'tubeBarcode',
    };
    for(let col=0; col<this.cols; col++) {
      const columnHead = this.loc(0, col);
      console.debug(columnHead, col);
      if (headerDict[columnHead]) {
        this.headers.push(headerDict[columnHead]);  
      } else {
        this.headers.push(columnHead);
        this.customHeaders.add(columnHead);
      }
      
    }
  }


  private loc(row, col) {
    const cell = this.sheet[`${toColStr(col)}${row+1}`];
    if (cell) {
      return cell.v;
    } else {
      return undefined;
    }
  }
  
}