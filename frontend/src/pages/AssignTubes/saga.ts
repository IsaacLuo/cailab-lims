import {IAction, IStoreState, IBasketState, IPart} from 'types'
// redux saga
import { delay} from 'redux-saga/effects';
import {call, all, fork, put, take, select, takeLatest, takeEvery} from 'redux-saga/effects'
// redux actions
import {
  GET_BASKET_FULL,
  SET_BASKET_CONTENT,
  ASSIGN_TUBE_TO_PART,
  NEW_BARCODE_ASSIGNED,
  RESIGN_TUBE,
  TUBE_RESIGNED,
  CANCEL_NEW_BARCODE_ASSIGNED,
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
    yield put({type:NEW_BARCODE_ASSIGNED, data:{partId, tubeId, submitStatus: 'pending'}});
    const res = yield call(axios.put, serverURL+`/api/part/${partId}/tube/${tubeId}`,{}, getAuthHeader());
    yield delay(1000);
    yield put({type:NEW_BARCODE_ASSIGNED, data:{partId, tubeId, submitStatus: 'verified'}});
  } catch (err) {
    if (err.response.status === 409) {
      Notification.error(err.response.data.message);
      yield put({type:CANCEL_NEW_BARCODE_ASSIGNED, data:{partId, tubeId, submitStatus: 'canceled'}});
    } else {
      Notification.error('failed to assign tube barcode');
    }
    
  }
}

function* resignTube(action:IAction) {
  const {partId, tubeId} = action.data;
  try {
    yield put({type:TUBE_RESIGNED, data:{tubeId, submitStatus: 'deleting'}});
    const res = yield call(axios.delete, serverURL+`/api/part/${partId}/tube/${tubeId}`, getAuthHeader());
    yield delay(1000);
    yield put({type:TUBE_RESIGNED, data:{tubeId, submitStatus: 'deleted'}});
  } catch (err) {
    Notification.error('failed to assign tube barcode');
  }
}

export default function* watchPartList() {
  yield takeLatest(GET_BASKET_FULL, getBasketFull);
  yield takeEvery(ASSIGN_TUBE_TO_PART, assignTubeToPart);
  yield takeEvery(RESIGN_TUBE, resignTube)
}