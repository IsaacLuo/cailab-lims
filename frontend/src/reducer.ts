import {IStoreState} from './store'
import {
  IAction,
  INITIALIZE_DONE,
  LOGIN_DIALOG_VISIBLE,
  SET_LOGIN_INFORMATION,
  CLEAR_LOGIN_INFORMATION,
  SET_PARTS_COUNT,
  SET_ALL_USER_NAMES,
  SET_NEW_PART_DIALOG_VISIBLE,
  SET_REDIRECT,
  CLEAR_REDIRECT,
} from './actions'

function myReducer(state :IStoreState = {
  initializing: true,
  loggedIn: false,
  userId: 'guest',
  fullName: 'guest',
  profilePicture: '',
  groups: [],
  loginDialogVisible: false,
  partsCount: {
    bacteria: 0,
    primers: 0,
    yeasts: 0,
  },
  allUsers: [],
  newPartDialogVisible: false,
  renderingParts: [],
}, action: IAction) {
  console.log('action:', action)
  switch (action.type) {
    case INITIALIZE_DONE:
      return {...state, initializing: false};

    case LOGIN_DIALOG_VISIBLE:
      return {...state, loginDialogVisible: action.data.visible}

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

    case SET_ALL_USER_NAMES:
      return {
        ...state,
        allUsers: action.data,
      }

    case SET_PARTS_COUNT:
      return {
        ...state,
        partsCount: action.data,
      }

    case SET_NEW_PART_DIALOG_VISIBLE:
      return {
        ...state,
        newPartDialogVisible: action.data,
      }

    case SET_REDIRECT:
      return {
        ...state,
        redirect: action.data,
      }
    
    case CLEAR_REDIRECT:
      return {
        ...state,
        redirect: undefined,
      }
  }
  return state;
}

export default myReducer