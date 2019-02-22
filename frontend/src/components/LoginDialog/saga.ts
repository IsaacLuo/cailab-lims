// types
import {
  IAction,
} from 'types'
// redux saga
import {delay} from 'redux-saga';
import {call, all, fork, put, take, select, takeLatest, takeEvery} from 'redux-saga/effects'
// redux actions
import {
  SEND_GOOGLE_AUTH_INFO_TO_SERVER,
  SEND_NORMAL_LOGIN_INFO_TO_SERVER,
} from './actions'

// other libs
import axios from 'axios'
import qs from 'qs'
import {Message} from 'element-react'


// helpers
import {serverURL} from 'config'
import getAuthHeader from 'authHeader'
import { SET_LOGIN_INFORMATION } from 'actions/userActions';
import { LOGIN_DIALOG_VISIBLE } from 'actions/appActions';

function* sendGoogleAuthInfoToServer (action:IAction) {
  const googleResponse = action.data;
  try {
    const res = yield call(axios.post, 
      serverURL + '/api/googleAuth/', 
      {
        token: googleResponse.tokenId,
      }
    )
    localStorage.setItem('token',res.data.token);
    localStorage.setItem('tokenTimeStamp', new Date().toLocaleString());
    yield put({type: SET_LOGIN_INFORMATION, data: res.data});
    yield put({type:LOGIN_DIALOG_VISIBLE, data: false});
    Message.success(res.data.message);
  } catch (err) {
    if (err.response) {
      Message.error({message:`${err.response.status}: ${err.response.statusText}`, duration:30000});
    } else {
      Message.error({message:err.toLocaleString()});
    }
  }
}

function* sendNormalLoginInfoToServer (action:IAction) {
  const {username, password} = action.data;
  try {
    const res = yield call(axios.post,
      serverURL + '/api/session/',
      {
        username,
        password,
      }
    );
  } catch (err) {
    Message.error({message:err.toLocaleString()});
  }
}

export default function* () {
  yield takeLatest(SEND_GOOGLE_AUTH_INFO_TO_SERVER, sendGoogleAuthInfoToServer);
  yield takeLatest(SEND_NORMAL_LOGIN_INFO_TO_SERVER, sendNormalLoginInfoToServer);
  
}