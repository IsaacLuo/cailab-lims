
import {
  IStoreState,
  IAction,
  IAppState,
  } from '../types'

import {
  INITIALIZE_DONE,
  LOGIN_DIALOG_VISIBLE,
  SET_PARTS_COUNT,
  SET_ALL_USER_NAMES,
  SET_NEW_PART_DIALOG_VISIBLE,
  SET_EDIT_PART_DIALOG_VISIBLE,
} from '../actions/appActions'

const DEFAULT_STATE:IAppState = {
  initializing: true,
  loginDialogVisible: false,
  newPartDialogVisible: false,
  editPartDialogVisible: false,
  editPartDialogPartId: '',
  allUsers: [],
}

function appReducer(state :IAppState = DEFAULT_STATE, action: IAction) {
  switch (action.type) {
    case INITIALIZE_DONE:
      return {...state, initializing: false};

    case LOGIN_DIALOG_VISIBLE:
      return {...state, loginDialogVisible: action.data};

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
  }
  return state;
}

export default appReducer