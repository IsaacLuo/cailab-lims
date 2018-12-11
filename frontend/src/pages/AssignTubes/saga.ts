import {IAction, IStoreState, IBasketState, IPart} from 'types'
// redux saga
import { delay} from 'redux-saga';
import {call, all, fork, put, take, select, takeLatest, takeEvery} from 'redux-saga/effects'
// redux actions
import {
  GET_BASKET_FULL,
  SET_BASKET_CONTENT,
  ASSIGN_TUBE_TO_PART,
  NEW_BARCODE_ASSIGNED,
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
    const res = yield call(axios.get, serverURL+`/api/picklist/${basketId}?full=true`, getAuthHeader());
    yield put({type:SET_BASKET_CONTENT, data:res.data.parts});
  } catch (err) {
    Notification.error('failed read basket');
  }
}

function* assignTubeToPart(action:IAction) {
  const {partId, tubeId} = action.data;
  try {
    yield put({type:NEW_BARCODE_ASSIGNED, data:{partId, tubeId, pending: true}});
    const res = yield call(axios.put, serverURL+`/api/part/${partId}/tube/${tubeId}`,{}, getAuthHeader());
    yield put({type:NEW_BARCODE_ASSIGNED, data:{partId, tubeId, pending: false}});
  } catch (err) {
    Notification.error('failed to assign tube barcode');
  }
}

export default function* watchPartList() {
  yield takeLatest(GET_BASKET_FULL, getBasketFull);
  yield takeEvery(ASSIGN_TUBE_TO_PART, assignTubeToPart);
}