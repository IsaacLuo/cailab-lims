/**
 * @file Assign tubes reducer
 */
import {
  IAction,
  ISearchRackBarcodeState,
} from '../../types'

import { 
  SET_MESSAGE,
  SET_RACK,
  CLEAR_RACK,
} from './actions'

const DEFAULT_STATE:ISearchRackBarcodeState = {
  message: '',
  tubes: [],
}

function assignTubesReducer(state :ISearchRackBarcodeState = DEFAULT_STATE, action: IAction) {
  switch(action.type){

    // after fetched picklist detail
    case SET_RACK:
      return {
        ...state,
        tubes: action.data.tubes,
      }

    case CLEAR_RACK:
      return {
        ...state,
        tubes: [],
      }

    case SET_MESSAGE:
      return {
        ...state,
        message: action.data,
      }
    default:
      return state;
  }
}

export default assignTubesReducer;