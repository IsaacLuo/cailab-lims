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
  SET_USER_FILTER,
  EXPORT_TO_XLSX,
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
    const {searchKeyword, sampleType, skip, userFilter, sortMethod} = yield select((state:IStoreState)=> state.partList);
    const limit = action.data;
    yield put({type:GET_PARTS, data: {searchKeyword, sampleType, limit, userFilter, sortMethod, skip: (skip < limit ? 0: skip)}});

  } catch (err) {
    console.error(err);
    Notification.error('failed to get the default basket');
  }
}

function* setUserFilter(action:IAction) {
  try {
    const {searchKeyword, sampleType, limit, skip, userFilter, sortMethod} = yield select((state:IStoreState)=> state.partList);
    yield put({type:GET_PARTS, data: {searchKeyword, sampleType, limit, userFilter: action.data, sortMethod, skip:0}});

  } catch (err) {
    console.error(err);
    Notification.error('failed to get the default basket');
  }
}

function* exportToXlsx(action:IAction) {
  const {searchKeyword, sampleType, userFilter, sortMethod} = yield select((state:IStoreState)=> state.partList);
  const {limit, skip} = action.data;
  const params = (skip!==undefined && limit!==undefined) ? qs.stringify({
    type: sampleType,
    skip,
    limit,
    user: userFilter,
    sortBy: sortMethod.prop,
    desc: sortMethod.order === 'desc' ? true : false,
    format: 'xlsx',
  }) : qs.stringify({
    type: sampleType,
    user: userFilter,
    sortBy: sortMethod.prop,
    desc: sortMethod.order === 'desc' ? true : false,
    format: 'xlsx',
  })

  const res = yield call(
    axios.get,
    serverURL+'/api/parts?'+params,
    {
      responseType: 'blob', // important
      ...getAuthHeader(),
    });

  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'export.xlsx');
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export default function* watchPartList() {
  yield takeLatest(GET_DEFAULT_BASKET, getDefaultBasket);
  yield takeLatest(GET_PARTS, getParts);
  yield takeLatest(SET_SKIP, setSkip);
  yield takeLatest(SET_LIMIT, setLimit);
  yield takeLatest(SET_USER_FILTER, setUserFilter);
  yield takeLatest(EXPORT_TO_XLSX, exportToXlsx);
}
