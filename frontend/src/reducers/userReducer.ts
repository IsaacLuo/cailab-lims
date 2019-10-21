import { TOKEN_REFRESHED } from './../actions/userActions';
import {
  IAction,
  IUserState,
} from '../types'

import {
  SET_LOGIN_INFORMATION,
  CLEAR_LOGIN_INFORMATION,
} from '../actions/userActions'
import { SET_MY_USER_BARCODE } from '../components/TokenBarcode/actions';

const DEFAULT_STATE:IUserState = {
  loggedIn: false,
  userId: 'guest',
  name: 'guest',
  email:'',
  groups: [],
  barcode: '',
  token: '',
  tokenRefreshTime: new Date(0),
}

function userReducer(state :IUserState = DEFAULT_STATE, action: IAction) {
  switch(action.type){
    case SET_LOGIN_INFORMATION:
      return {
        ...state,
        userId: action.data.id,
        name: action.data.name,
        email: action.data.email,
        groups: action.data.groups,
        loggedIn: true,
      }

    case CLEAR_LOGIN_INFORMATION:
      localStorage.removeItem('token')
      localStorage.removeItem('tokenTimeStamp');
      return {
        ...state,
        userId: 'guest',
        name: 'guest',
        email: '',
        groups: [],
        profilePicture: '',
        loggedIn: false,
      }
    
    case SET_MY_USER_BARCODE:
      return {
        ...state,
        barcode: action.data,
      }
    
    case TOKEN_REFRESHED:
      console.log(action.data);
      return {
        ...state,
        token: action.data.token,
        tokenRefreshTime: action.data.refreshTime,
      }
  }
  return state;
}

export default userReducer;