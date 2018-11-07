import {IStoreState, defaultStoreState} from './store'
import {
  IAction,
  INITIALIZE_DONE,
  LOGIN_DIALOG_VISIBLE,
  SET_LOGIN_INFORMATION,
  CLEAR_LOGIN_INFORMATION,
  SET_PARTS_COUNT,
  SET_ALL_USER_NAMES,
  SET_NEW_PART_DIALOG_VISIBLE,
  SET_EDIT_PART_DIALOG_VISIBLE,
} from './actions'

function myReducer(state :IStoreState = defaultStoreState, action: IAction) {
  // console.log('action:', action)
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

    case SET_EDIT_PART_DIALOG_VISIBLE:
      return {
        ...state,
        editPartDialogVisible: action.data.visible,
        editPartDialogPartId: action.data.partId,
      }

    case 'SET_CURRENT_BASKET':
      return {
        ...state,
        currentBasket: action.data,
      }
  }
  return state;
}

export default myReducer