import {IAction, IStoreState, IBasketState, IPart} from 'types'
// redux saga
import {call, all, fork, put, take, select, takeLatest, takeEvery} from 'redux-saga/effects'
// redux actions
import {
  GET_PART,
  SET_PART,
  SET_MESSAGE,
} from './actions'


// other libs
import axios from 'axios'
import qs from 'qs'
import {Notification} from 'element-react'

// helpers
import {serverURL} from 'config'
import getAuthHeader from 'authHeader'

function* getPart(action:IAction) {
  const {id} = action.data;
  try {
    const res = yield call(axios.get, serverURL+`/api/part/${id}?containers=true`, getAuthHeader());
    yield put({type:SET_MESSAGE, data: ''});
    yield put({type:SET_PART, data:res.data});
  } catch (err) {
    const message = `unable to get part ${id}`;
    Notification.error(message);
    yield put({type:SET_MESSAGE, data: message});
    yield put({type:SET_PART, data: undefined});
  }
}

export default function* watchPart() {
  yield takeLatest(GET_PART, getPart);
}