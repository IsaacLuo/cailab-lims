import * as xlsx from 'xlsx'
import { O_RDONLY } from 'constants';

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

function toColStr(col:number) {
  const nums:number[] = [];
  do {
    nums.unshift(col%26 + 65);
    col = Math.floor(col/26) - 1;
  } while(col >= 0);
  return String.fromCharCode.apply(null, nums);
}

export function readPartsFromExcel(workbook: xlsx.WorkBook) {
  console.log(workbook);
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
    cols+=reexe[1].charCodeAt(i);
  }
  const rows = parseInt(reexe[2],10);
  const loc = (row, col) => sheet[`${toColStr(col)}${row}`];
  console.log(rows, cols);
  for (let row = 1; row<rows; row++) {
    console.log(loc(row, 1));
  }
}