import {IAction, IStoreState, IBasketState} from 'types'
// redux saga
import { delay} from 'redux-saga';
import {call, all, fork, put, take, select, takeLatest} from 'redux-saga/effects'
// redux actions
import {
  GET_DEFAULT_BASKET,
  SET_CURRENT_BASKET,
} from './actions'


// other libs
import axios from 'axios'
import qs from 'qs'
import {Notification} from 'element-react'

// helpers
import {serverURL} from 'config'
import getAuthHeader from 'authHeader'

function* getDefaultBasket(action:IAction) {
  try {
    const res = yield call(axios.get, serverURL+`/api/picklist/0`, getAuthHeader());
    console.debug('my current basket', res.data);
    yield put({type: SET_CURRENT_BASKET, data: res.data});
  } catch (err) {
    console.error(err);
    Notification.error('failed to get the default basket');
  }
}

export default function* watchPartList() {
  yield takeLatest(GET_DEFAULT_BASKET, getDefaultBasket);
}