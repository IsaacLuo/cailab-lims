import {Response} from 'express'

import {IPart} from './types'

export default function sendBackCSV(res :Response, parts :IPart[]) {
  const bom = new Buffer('\xEF\xBB\xBF', 'binary');
  res.write(bom);
  let titles = ['labName', 'personalName', 'comment', 'date', 'tags'];
  let typeSet = new Set();
  for (const part of parts) {
    typeSet.add(part.sampleType);
  }
  if (typeSet.has('bacterium')) {
    titles = [...titles, 'plasmidName', 'hostStrain', 'markers'];
  }
  if (typeSet.has('primer')) {
    titles = [...titles, 'description', 'sequence', 'orientation', 'meltingTemperature', 'concentration', 'vendor'];
  }
  if (typeSet.has('yeast')) {
    titles = [...titles, 'parents', 'genotype', 'plasmidType'];
    if (!typeSet.has('bacterium')) {
      titles.push('markers');
    }
  }
  res.write(titles.join(',')+'\n');
  for (const part of parts) {
    for (const key of titles) {
      let value :any = part[key];
      if (value === undefined || value === null) {
        value = '';
      } else if (Array.isArray(value)) {
        value = value.join('; ');
      } else if (value instanceof Date) {
        // do not use getLocalDateString, to make sure the date is in UK format on any computer
        value = `${value.getDate()}/${value.getMonth()}/${value.getFullYear()}`;
      }
      res.write(`${value},`);
    }
    res.write('\n');
  }
  // res.write('labName,personalName,tags, date,')
  res.end();
}