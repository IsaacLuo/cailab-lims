import {
  IAction,
  IUserState,
} from 'types'

import {
  SET_LOGIN_INFORMATION,
  CLEAR_LOGIN_INFORMATION,
} from 'actions/userActions'
import { SET_MY_USER_BARCODE } from 'components/TokenBarcode/actions';

const DEFAULT_STATE:IUserState = {
  loggedIn: false,
  userId: 'guest',
  fullName: 'guest',
  groups: [],
  barcode: '',
}

function userReducer(state :IUserState = DEFAULT_STATE, action: IAction) {
  switch(action.type){
    case SET_LOGIN_INFORMATION:
      return {
        ...state,
        userId: action.data.id,
        fullName: action.data.name,
        groups: action.data.groups,
        loggedIn: true,
      }

    case CLEAR_LOGIN_INFORMATION:
      localStorage.removeItem('token')
      localStorage.removeItem('tokenTimeStamp');
      return {
        ...state,
        userId: 'guest',
        fullName: 'guest',
        groups: [],
        profilePicture: '',
        loggedIn: false,
      }
    
    case SET_MY_USER_BARCODE:
      return {
        ...state,
        barcode: action.data,
      }
  }
  return state;
}

export default userReducer;