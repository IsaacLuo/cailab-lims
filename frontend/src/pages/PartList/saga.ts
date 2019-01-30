import {IAction, IStoreState, IBasketState} from 'types'
// redux saga
import { delay} from 'redux-saga';
import {call, all, fork, put, take, select, takeLatest} from 'redux-saga/effects'
// redux actions
import {
  GET_DEFAULT_BASKET,
  SET_CURRENT_BASKET,
  GET_PARTS,
  SET_SEARCH_PARTS_RESULT,
  SET_SKIP,
  SET_LIMIT,
  SET_SEARCH_KEYWORD,
  SET_SEARCH_FILTER,
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

function* getParts(action:IAction) {
  try {
    console.log("get_part");
    // const res = yield call(axios.get, serverURL+`/api/picklist/0`, getAuthHeader());
    // console.debug('my current basket', res.data);
    // yield put({type: SET_CURRENT_BASKET, data: res.data});
    const {searchKeyword, sampleType, skip, limit, userFilter, sortMethod} = action.data;
    const res = yield call(axios.get, serverURL+'/api/parts?'+qs.stringify({
      search: searchKeyword,
      type: sampleType,
      skip,
      limit,
      user: userFilter,
      sortBy: sortMethod.prop,
      desc: sortMethod.order === 'desc' ? true : false,
    }),
    getAuthHeader());
    console.log(res.data);
    yield put({type:SET_SEARCH_PARTS_RESULT, data:{
      parts: res.data.parts,
      count: res.data.totalCount,
    }});

    yield put({type:SET_SEARCH_FILTER, data: {
      searchKeyword, sampleType, skip, limit, userFilter, sortMethod,
    }});

  } catch (err) {
    console.error(err);
    Notification.error('failed to get the default basket');
    yield put({type:SET_SEARCH_PARTS_RESULT, data:{
      parts: [],
      count: 0,
    }});
  }
}

function* setSkip(action:IAction) {
  try {
    const {searchKeyword, sampleType, limit, userFilter, sortMethod} = yield select((state:IStoreState)=> state.partList);
    const skip = action.data;
    yield put({type:GET_PARTS, data: {searchKeyword, sampleType, limit, userFilter, sortMethod, skip}});

  } catch (err) {
    console.error(err);
    Notification.error('failed to get the default basket');
  }
}

function* setLimit(action:IAction) {
  try {
    const {searchKeyword, sampleType, limit, userFilter, sortMethod} = yield select((state:IStoreState)=> state.partList);
    const skip = action.data;
    yield put({type:GET_PARTS, data: {searchKeyword, sampleType, limit, userFilter, sortMethod, skip}});

  } catch (err) {
    console.error(err);
    Notification.error('failed to get the default basket');
  }
}

export default function* watchPartList() {
  yield takeLatest(GET_DEFAULT_BASKET, getDefaultBasket);
  yield takeLatest(GET_PARTS, getParts);
  yield takeLatest(SET_SKIP, setSkip);
  yield takeLatest(SET_LIMIT, setLimit);
}
