import {IStoreState} from './store'
import {
  IAction,
  LOGIN_DIALOG_VISIBLE,
  SET_LOGIN_INFORMATION,
  CLEAR_LOGIN_INFORMATION,
  VERIFY_MYSELF,
} from './actions'
import axios from '../node_modules/axios';
import { serverURL } from './config';
import getAuthHeader from './authHeader';

function myReducer(state :IStoreState = {
  loggedIn: false,
  username: 'guest',
  fullName: 'guest',
  profilePicture: '',
  groups: [],
  loginDialogVisible: false,
}, action: IAction) {
  console.log('action:', action)
  switch (action.type) {
    case LOGIN_DIALOG_VISIBLE:
      return {...state, loginDialogVisible: action.data.visible}

    case SET_LOGIN_INFORMATION:
      return {
        ...state,
        fullName: action.data.name,
        groups: action.data.groups,
        loggedIn: true,
      }

    case CLEAR_LOGIN_INFORMATION:
      return {
        ...state,
        fullName: 'guest',
        groups: [],
        profilePicture: '',
        loggedIn: false,
      }
  }
  return state;
}

export default myReducer