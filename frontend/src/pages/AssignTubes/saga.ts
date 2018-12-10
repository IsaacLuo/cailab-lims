import {IAction, IStoreState, IBasketState, IPart} from 'types'
// redux saga
import { delay} from 'redux-saga';
import {call, all, fork, put, take, select, takeLatest} from 'redux-saga/effects'
// redux actions
import {
  GET_BASKET_FULL,
} from './actions'
import {
  FILL_PARTS_INTO_BASKET_LIST,
} from '../BasketList/actions'


// other libs
import axios from 'axios'
import qs from 'qs'
import {Notification} from 'element-react'

// helpers
import {serverURL} from 'config'
import getAuthHeader from 'authHeader'

function* getBasketFull(action:IAction) {
  const basketId = action.data;
  try {
    const res = yield call(axios.get, serverURL+`/api/picklist/${basketId}`, getAuthHeader());
    yield put({type:FILL_PARTS_INTO_BASKET_LIST, data:res.data});
    const parts:any[] = res.data.parts;
    const partsInDetail:IPart[] = [];
    for (const part of parts) {
      const partId = part._id;
      const resPart = yield call(axios.get, serverURL+`/api/part/${partId}`, getAuthHeader());
      partsInDetail.push(resPart.data);
    }
    yield put({type:FILL_PARTS_INTO_BASKET_LIST, data:{
      ...res.data, parts:partsInDetail,
    }});
  } catch (err) {
    Notification.error('failed read basket');
  }
}

export default function* watchPartList() {
  yield takeLatest(GET_BASKET_FULL, getBasketFull);
}