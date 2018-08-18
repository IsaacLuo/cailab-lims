import {all, fork, put, takeEvery} from 'redux-saga/effects'
import axios from 'axios'
import {serverURL} from './config'
import getAuthHeader from './authHeader'
import {ActionSetLoginInformation} from './actions'

export function* getMyStatus() {
  const res = yield axios.get(serverURL+'/api/currentUser', getAuthHeader())
  console.log(res);
  const {fullName, groups} = res.data;
  yield put(ActionSetLoginInformation(fullName, groups));
}

export function* watchGetMyStatus() {
  yield takeEvery('GET_MY_STATUS', getMyStatus);
}

export default function* rootSaga() {
  yield all([
    fork(watchGetMyStatus),
  ]);
}