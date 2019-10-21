/**
 * @file Assign tubes reducer
 */
import {
  IAction,
  ISearchRackBarcodeState,
  IPartState,
} from '../../types'

import { 
  SET_MESSAGE,
  SET_PART,
} from './actions'

const DEFAULT_STATE:IPartState = {
  message: '',
  part: undefined,
}

function partReducer(state :IPartState = DEFAULT_STATE, action: IAction) {
  switch(action.type){

    // after fetched picklist detail
    case SET_PART:
      return {
        ...state,
        part: action.data,
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

export default partReducer;