import {IAction, IStoreState, IBasketState} from 'types'
// redux saga
import {delay} from 'redux-saga/effects';
import {call, all, fork, put, take, select, takeLatest} from 'redux-saga/effects'
// redux actions
import {
  SET_CONTAINER_LIST,
  GET_CONTAINER_LIST,
  SET_SKIP,
  SET_LIMIT,

} from './actions'


// other libs
import axios from 'axios'
import qs from 'qs'
import {Notification} from 'element-react'

// helpers
import {serverURL} from 'config'
import getAuthHeader from 'authHeader'

// components
import {
  Message,
} from 'element-react'

function* getContainers(action:IAction) {
  try {
    const {skip, limit} = action.data;
    const res = yield call(axios.get, serverURL+'/api/containers/?'+qs.stringify({
      skip,
      limit,
    }),
    getAuthHeader());
    
    yield put({type:SET_CONTAINER_LIST, data:{
      containers: res.data.containers,
      count: res.data.totalCount,
    }});
  } catch (err) {
    console.error(err);
    yield put({type:SET_CONTAINER_LIST, data:{
      parts: [],
      count: 0,
    }});
  }
}

function* setSkip(action:IAction) {
  try {
    const {limit} = yield select((state:IStoreState)=> state.partList);
    const skip = action.data;
    yield put({type:GET_CONTAINER_LIST, data: {limit, skip}});

  } catch (err) {
    console.error(err);
    Notification.error('faild to set skip');
  }
}

function* setLimit(action:IAction) {
  try {
    const {skip,} = yield select((state:IStoreState)=> state.partList);
    const limit = action.data;
    yield put({type:GET_CONTAINER_LIST, data: {limit, skip: (skip < limit ? 0: skip)}});

  } catch (err) {
    console.error(err);
    Notification.error('failed to set limit');
  }
}


export default function* watchContainers() {
  yield takeLatest(GET_CONTAINER_LIST, getContainers);
  yield takeLatest(SET_SKIP, setSkip);
  yield takeLatest(SET_LIMIT, setLimit);
}
