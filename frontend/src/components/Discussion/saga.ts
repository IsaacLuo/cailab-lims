import { cailabAuthURL } from './../../config';
// types
import {
  IAction,
} from 'types'
// redux saga
import {call, all, fork, put, take, select, takeLatest, takeEvery} from 'redux-saga/effects'
// redux actions
import {
  QUERY_COMMENTS,
  SET_COMMENT_LIST,
  POST_NEW_COMMENT,
  SET_NEW_COMMENT_TEXT,
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
import { SET_PART } from 'pages/Part/actions';


function* onPartSet(action:IAction) {
  const part = action.data;
  if(part) {
    yield put({type: QUERY_COMMENTS, data: {partId:part._id}});
  }
}

function* queryComments (action:IAction) {
  try {
    const {partId} = action.data;
    const res = yield call(axios.get,
      serverURL + `/api/part/${partId}/comments/`,
      {withCredentials: true}
    );
    yield put({type: SET_COMMENT_LIST, data: {partId, comments:res.data}});
  } catch (err) {
    Message.error({message:err.toLocaleString()});
  }
}

function* postNewComment (action:IAction) {
  try {
    const {partId} = action.data;
    const res = yield call(axios.post,
      serverURL + `/api/part/${partId}/comments/`,
      action.data,
      {withCredentials: true}
    );
    yield put({type: QUERY_COMMENTS, data: {partId}});
    yield put({type:SET_NEW_COMMENT_TEXT, data: ''});
  } catch (err) {
    Message.error({message:err.toLocaleString()});
  }
}



export default function* () {
  yield takeLatest(QUERY_COMMENTS, queryComments);
  yield takeLatest(SET_PART, onPartSet);
  yield takeLatest(POST_NEW_COMMENT, postNewComment);
}