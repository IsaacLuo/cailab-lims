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


function toColStr(col:number) {
  const nums:number[] = [];
  do {
    nums.unshift(col%26 + 65);
    col = Math.floor(col/26) - 1;
  } while(col >= 0);
  return String.fromCharCode.apply(null, nums);
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
  private headers: string[];
  private customHeaders: Set<string> = new Set();

  constructor(sheet: xlsx.Sheet, rows:number, cols:number) {
    console.debug(sheet, rows, cols);
    this.sheet = sheet;
    this.rows = rows;
    this.cols = cols;
    this.readTableHeaders();
    console.debug(this.headers);
  }

  public readData() {
    const data:any[] = [];
    for(let row=1; row<this.rows; row++) {
      const dataObj:any = {};
      for(let col=0; col<this.cols; col++) {
        const header = this.headers[col];
        
        const originalData = this.loc(row,col);
        console.debug(`row ${row}, col ${col},`, originalData);
        if (this.customHeaders.has(header)) {
          if (dataObj.customData === undefined) {
            dataObj.customData = [];
          }
          if (/(^|\s)date($|\s)/.test(header) && typeof(originalData) === 'number') {
            // 25569 is the days of 1970/1/1 - 1900/1/1, 86400000 is the ms of a day
          dataObj.customData[header] = new Date((originalData - 25569)*86400000);
          } else {
          dataObj.customData[header] = originalData;
          }
        }
        if (header === 'date') {
          // 25569 is the days of 1970/1/1 - 1900/1/1, 86400000 is the ms of a day
          dataObj[header] = new Date((originalData - 25569)*86400000);
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

  private readTableHeaders() {
    this.headers = [];
    for(let col=0; col<this.cols; col++) {
      const columnHead = this.loc(0, col);
      console.debug(columnHead);
      switch(columnHead) {
        case 'Plasmid Name':
          this.headers.push('plasmidName');
          break;
        case 'Other Names\r\n(semicolon-seperated)':
          this.headers.push('tags');
          break;
        case 'Description or Comment':
          this.headers.push('comment');
          break;
        case 'Date\r\n(DD/MM/YYYY)':
          this.headers.push('date');
          break;
        case 'Host Strain':
          this.headers.push('hostStrain');
          break;
        case 'Bacterial Markers\r\n(semicolon-seperated)':
          this.headers.push('markers');
          break;
        case 'Plate Barcode':
          this.headers.push('plateBarcode');
          break;
        case 'Well ID':
          this.headers.push('wellId');
          break;
        case 'Tube Barcode':
          this.headers.push('tubeBarcode');
          break;
        default:
          if (col < 9) {
            throw new Error('table header error');
          }
          this.headers.push(columnHead);
          this.customHeaders.add(columnHead);
      }
    }
  }


  private loc(row, col) {
    return this.sheet[`${toColStr(col)}${row+1}`].v;
  }
}