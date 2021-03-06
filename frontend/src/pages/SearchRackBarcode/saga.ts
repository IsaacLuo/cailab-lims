import {IAction, IStoreState, IBasketState, IPart} from '../../types'
// redux saga
import {delay} from 'redux-saga/effects';
import {call, all, fork, put, take, select, takeLatest, takeEvery} from 'redux-saga/effects'
// redux actions
import {
  GET_RACK,
  SET_RACK,
  SET_MESSAGE,
  CLEAR_RACK,
} from './actions'
import {
  FILL_PARTS_INTO_BASKET_LIST,
} from '../BasketList/actions'


// other libs
import axios from 'axios'
import qs from 'qs'
import {Notification} from 'element-react'

// helpers
import {serverURL} from '../../config'
import getAuthHeader from '../../authHeader'

function* getPart(action:IAction) {
  const {barcode} = action.data;
  try {
    const res = yield call(axios.get, serverURL+`/api/tubeRack/${barcode}?full=true`, getAuthHeader());
    yield put({type:SET_MESSAGE, data: ''});
    yield put({type:SET_RACK, data:res.data});
  } catch (err) {
    const message = `unable to find the tube barcode ${barcode}`;
    Notification.error(message);
    yield put({type:SET_MESSAGE, data: message});
    yield put({type:CLEAR_RACK});
  }
}

export default function* watchPartList() {
  yield takeLatest(GET_RACK, getPart);
}