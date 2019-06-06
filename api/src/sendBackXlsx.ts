import {Response} from 'express'
import {IPart, Ctx} from './types'
import xlsx from 'node-xlsx'
// import fs from 'fs'

export default function sendBackXlsx(ctx:Ctx, parts :IPart[]) {
  
  let common_titles = ['labName', 'personalName', 'comment', 'date', 'tags'];
  let content_tiles = [];
  let typeSet = new Set();
  for (const part of parts) {
    typeSet.add(part.sampleType);
  }
  if (typeSet.has('bacterium')) {
    content_tiles = [...content_tiles, 'plasmidName', 'hostStrain', 'markers'];
  }
  if (typeSet.has('primer')) {
    content_tiles = [...content_tiles, 'description', 'sequence', 'orientation', 'meltingTemperature', 'concentration', 'vendor'];
  }
  if (typeSet.has('yeast')) {
    content_tiles = [...content_tiles, 'parents', 'genotype', 'plasmidType'];
    if (!typeSet.has('bacterium')) {
      content_tiles.push('markers');
    }
  }
  const titles = [...common_titles, ...content_tiles];

  const data = [titles];
  for (const part of parts) {
    const row = [];
    const values = [...common_titles.map( key => part[key] ), ...content_tiles.map( key => part.content[key] )];
    for (let value of values) { 
      if (value === undefined || value === null) {
        value = '';
      } else if (Array.isArray(value)) {
        value = value.join('; ');
      } else if (value instanceof Date) {
        // do not use getLocalDateString, to make sure the date is in UK format on any computer
        // value = `${value.getDate()}/${value.getMonth()}/${value.getFullYear()}`;
      }
      row.push(value);
    }
    data.push(row);
  }
  // res.set({"Content-Disposition":"attachment; filename=\"export.xlsx\""});
  // res.setHeader('Content-type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  // res.write('labName,personalName,tags, date,')
  const excel = xlsx.build([{name: 'Sheet1', data}]) as Buffer;
  // const f = fs.createWriteStream('1.xlsx');
  // f.write(excel);
  ctx.response.type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  ctx.body = excel;
}