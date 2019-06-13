import {IAction} from 'types'
// redux saga
import {delay} from 'redux-saga/effects';
import {call, all, fork, put, take, select, takeLatest} from 'redux-saga/effects'
// redux actions
import {
  QUERY_MY_USER_BARCODE,
  SET_MY_USER_BARCODE,
} from './actions'


// other libs
import axios from 'axios'
import qs from 'qs'
import {Notification} from 'element-react'

// helpers
import {serverURL} from 'config'
import getAuthHeader from 'authHeader'

function* queryMyUserBarcode(action:IAction) {
  try {
    const res = yield call(axios.get, serverURL+`/api/user/current/barcode`, getAuthHeader());
    yield put({type:SET_MY_USER_BARCODE, data: res.data.barcode});
  } catch (err) {
    console.error(err);
    Notification.error('unable to get user barcode');
  }
}

export default function* saga() {
  yield takeLatest(QUERY_MY_USER_BARCODE, queryMyUserBarcode);
}