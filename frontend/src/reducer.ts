import {IStoreState} from './store'
import {
  IAction,
  LOGIN_DIALOG_VISIBLE,
  SET_LOGIN_INFORMATION,
  CLEAR_LOGIN_INFORMATION,
  SET_PARTS_COUNT,
} from './actions'

function myReducer(state :IStoreState = {
  loggedIn: false,
  username: 'guest',
  fullName: 'guest',
  profilePicture: '',
  groups: [],
  loginDialogVisible: false,
  partsCount: {
    bacteria: 0,
    primers: 0,
    yeasts: 0,
  }
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

    case SET_PARTS_COUNT:
      return {
        ...state,
        partsCount: action.data,
      }
  }
  return state;
}

export default myReducer