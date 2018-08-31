import {call, all, fork, put,takeLatest} from 'redux-saga/effects'
import axios from 'axios'
import {serverURL} from './config'
import getAuthHeader from './authHeader'
import {
  ActionInitizeDone,
  ActionSetLoginInformation, 
  ActionSetPartsCount,
  ActionSetAllUserNames,
  IAction,
  ActionClearLoginInformation,
} from './actions'

import qs from 'qs'
import { delay } from 'redux-saga';

export function* getMyStatus() {
  try {
    const res = yield call(axios.get,serverURL+'/api/currentUser', getAuthHeader());

    const {username, fullName, groups, token} = res.data;
    if (username === 'guest') {
      yield put(ActionClearLoginInformation());
    } else {
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('tokenTimeStamp', new Date().toLocaleString());
      }
      yield put(ActionSetLoginInformation(fullName, groups));
      yield call(delay, 600000);
      yield put({type:'GET_MY_STATUS'});
    }
  } catch (err) {
    yield put(ActionClearLoginInformation());
  }
}

export function* initialize() {
  try {
    const res = yield call(axios.get,serverURL+'/api/currentUser', getAuthHeader());
    const {username, fullName, groups, token} = res.data;
    if (username === 'guest') {
      yield put(ActionClearLoginInformation());
    } else {
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('tokenTimeStamp', new Date().toLocaleString());
      }
      yield put(ActionSetLoginInformation(fullName, groups));
    }
  } catch (err) {
    yield put(ActionClearLoginInformation());
  }
  yield put(ActionInitizeDone());
}

export function* getUserList() {
  const res = yield call(axios.get,serverURL+'/api/users/names/', getAuthHeader());
  yield put(ActionSetAllUserNames(res.data));
}

export function* watchMyInformation() {
  yield takeLatest('INITIALIZE', initialize);
  yield takeLatest('GET_MY_STATUS', getMyStatus);
  yield takeLatest('GET_USER_LIST', getUserList);
}

export function* getPartsCount() {
  const res = yield call(axios.get,serverURL+'/api/parts/count', getAuthHeader());
  yield put(ActionSetPartsCount(res.data));
}

export function* getParts(action: IAction) {
  const {type, skip, limit, user, sortBy, desc} = action.data;
  const res = yield call(
    axios.get, serverURL+'/api/parts?' + 
    qs.stringify({
    type,
    skip,
    limit,
    user,
    sortBy,
    desc,
  }),
  getAuthHeader());
  console.log(res);
  let data = [];
  switch (type) {
  case 'bacterium':
    data = res.data.map(item => ({
      labName: item.labName,
      personalName: item.personalName,
      tags: item.content.tags ? item.content.tags.join('; ') : '',
      hostStrain: item.content.hostStrain ? item.content.hostStrain : '',
      markers: item.content.markers ? item.content.markers.join('; ') : '',
      date: item.date ? (new Date(item.date)).toLocaleDateString() : '',
      comment: item.comment ? item.comment : '',
      attachments: item.attachments,
    }))
  break;
  case 'primer':
    data = res.data.map(item => ({
      labName: item.labName,
      personalName: item.personalName,
      tags: item.content.tags ? item.content.tags.join('; ') : '',
      date: item.date ? (new Date(item.date)).toLocaleDateString() : '',
      comment: `${item.content.description} ${item.comment}`,
      attachments: item.attachments,
      sequence: item.content.sequence,
      orientation: item.content.orientation,
      meltingTemperature: item.content.meltingTemperature,
      concentration: item.content.concentration,
      vendor: item.content.vendor,
    }))
  case 'yeast':
  case 'primer':
    data = res.data.map(item => ({
      labName: item.labName,
      personalName: item.personalName,
      tags: item.content.tags ? item.content.tags.join('; ') : '',
      date: item.date ? (new Date(item.date)).toLocaleDateString() : '',
      comment: item.comment,
      attachments: item.attachments,
      
      parents: item.content.parents ? item.content.parents.join('; ') : '' ,
      genotype: item.content.genotype ? item.content.genotype.join('; ') : '' ,
      plasmidType: item.content.plasmidType,
      markers: item.content.markers ? item.content.markers.join('; ') : '' ,
    }))
  break;
  }
}

export function* watchParts() {
  yield takeLatest('GET_PARTS_COUNT', getPartsCount);
  yield takeLatest('GET_PARTS', getParts);
}

export default function* rootSaga() {
  yield all([
    fork(watchMyInformation),
    fork(watchParts),
  ]);
}