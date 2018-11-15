import {IAction, IStoreState, IBasketState} from 'types'
// redux saga
import { delay} from 'redux-saga';
import {call, all, fork, put, take, select, takeLatest} from 'redux-saga/effects'
// redux actions
import {
  ActionSetABasketName,
  ADD_BASKET,
  SET_BASKET_LIST,
  SET_DEFAULT_BASKET_ID,
  DELETE_BASKET,
  GET_BASKET_LIST,
  FILL_PARTS_INTO_BASKET_LIST,
  GET_BASKET,
  DELETE_PART_FROM_BASKET,
  SET_CURRENT_BASKET,
  SUBMIT_DEFAULT_BASKET_ID,
  SUBMIT_A_BASKET_NAME,
  CLEAR_BASKET,
} from './actions'


// other libs
import axios from 'axios'
import qs from 'qs'
import {Notification} from 'element-react'

// helpers
import {serverURL} from 'config'
import getAuthHeader from 'authHeader'


function* getBasket(action:IAction) {
  const basketId = action.data;
  try {
    const res = yield call(axios.get, serverURL+`/api/picklist/${basketId}`, getAuthHeader());
    yield put({type:FILL_PARTS_INTO_BASKET_LIST, data:res.data});
  } catch (err) {
    Notification.error('failed read basket');
  }
}

function* deletePartFromBasket(action:IAction) {
  const {basketId, partId} = action.data;
  try {
    const res = yield call(axios.delete, serverURL+`/api/picklist/${basketId}/items/${partId}`, getAuthHeader());
    yield put({type:FILL_PARTS_INTO_BASKET_LIST, data:res.data});
  } catch (err) {
    Notification.error('failed read basket');
  }
}

function* clearBasket(action:IAction) {
  const basketId = action.data;
    try {
    const res = yield call(axios.delete, serverURL+`/api/picklist/${basketId}/items/`, getAuthHeader());
    yield put({type:SET_CURRENT_BASKET, data:res.data});
  } catch (err) {
    Notification.error('failed read basket');
  }
}

function* getBasketList(action:IAction) {
  try {
    const res = yield call(axios.get, serverURL+'/api/pickLists/', getAuthHeader());
    yield put({type:SET_BASKET_LIST, data:res.data.pickLists.map(v=>({...v, parts:[]})) });
    yield put({type:SET_DEFAULT_BASKET_ID, data:res.data.defaultPickListId})
  } catch (err) {
    Notification.error('failed load basket list');
  }
}

function* submitDefaultBasketId(action:IAction) {
  const basketId = action.data;
  try{
    yield put({type:SET_DEFAULT_BASKET_ID, data:action.data});
    const res = yield call(axios.put, serverURL+'/api/defaultPickListId',{pickListId:basketId}, getAuthHeader());
    if (res.data.pickListId !== basketId) {
      yield put({type:SET_DEFAULT_BASKET_ID, data:res.data.basketId});
    }
  } catch (err) {
    Notification.error('failed set default basket');
  }
}

function* submitABasketname(action:IAction) {
  const basketName = action.data.basketName;
  const basketId = action.data.basketId;
  try {
    yield put(ActionSetABasketName(basketId, basketName));
    const res = yield call(axios.post, serverURL+`/api/picklist/${basketId}/name`, {name:basketName}, getAuthHeader());
    if (res.data.pickListName !== basketName) {
      yield put(ActionSetABasketName(basketId, res.data.basketName));
    }
  } catch (err) {
    Notification.error('failed change basket name');
  }
}

function* addBasket(action:IAction) {
  const newBasketName = (new Date()).toISOString();
  try {
    const res = yield call(axios.put, serverURL+`/api/picklist/${newBasketName}`, {}, getAuthHeader());
    const newBasket = res.data;

    const basketList = yield select((state:IStoreState)=> state.basket.basketList);

    yield put({type:SET_BASKET_LIST, data:[...basketList, newBasket]});
    yield put({type:SET_DEFAULT_BASKET_ID, data:newBasket._id});

  } catch (err) {
    console.error(err);
    Notification.error('failed to create a basket');
  }
}

function* deleteBasket(action:IAction) {
  const basketId:string = action.data;
  try {
    const res = yield call(axios.delete, serverURL+`/api/picklist/${basketId}`, getAuthHeader());
    yield put({type:GET_BASKET_LIST});
  } catch (err) {
    console.error(err);
    Notification.error('failed to create a basket');
  }
}

export default function* watchBasket() {
  yield takeLatest(GET_BASKET_LIST, getBasketList);
  yield takeLatest(SUBMIT_DEFAULT_BASKET_ID, submitDefaultBasketId);
  yield takeLatest(SUBMIT_A_BASKET_NAME, submitABasketname);
  yield takeLatest(GET_BASKET, getBasket);

  yield takeLatest(DELETE_PART_FROM_BASKET, deletePartFromBasket);
  yield takeLatest(CLEAR_BASKET, clearBasket);
  yield takeLatest(ADD_BASKET, addBasket);
  yield takeLatest(DELETE_BASKET, deleteBasket);
}