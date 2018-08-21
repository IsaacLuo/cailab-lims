import {call, all, fork, put, takeEvery, takeLatest} from 'redux-saga/effects'
import axios from 'axios'
import {serverURL} from './config'
import getAuthHeader from './authHeader'
import {ActionSetLoginInformation, ActionSetPartsCount} from './actions'

export function* getMyStatus() {
  const res = yield call(axios.get,serverURL+'/api/currentUser', getAuthHeader());
  console.log(res);
  const {fullName, groups, token} = res.data;
  if (token) {
    localStorage.setItem('token', token);
    localStorage.setItem('tokenTimeStamp', new Date().toLocaleString());
  }
  yield put(ActionSetLoginInformation(fullName, groups));
}

export function* watchGetMyStatus() {
  yield takeEvery('GET_MY_STATUS', getMyStatus);
}

export function* getPartsCount() {
  const res = yield call(axios.get,serverURL+'/api/parts/count', getAuthHeader());
  yield put(ActionSetPartsCount(res.data));
}

export function* watchParts() {
  yield takeLatest('GET_PARTS_COUNT', getPartsCount);
}

export default function* rootSaga() {
  yield all([
    fork(watchGetMyStatus),
    fork(watchParts),
  ]);
}