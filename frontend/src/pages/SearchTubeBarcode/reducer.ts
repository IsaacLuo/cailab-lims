/**
 * @file Assign tubes reducer
 */
import {
  IAction,
  IAssignTubesState,
  IPart,
  ISearchTubeBarcodeState,
} from '../../types'

import { 
  SET_PART, SET_MESSAGE,
} from './actions'

const DEFAULT_STATE:ISearchTubeBarcodeState = {
  tube: undefined,
  message: '',
}

function assignTubesReducer(state :ISearchTubeBarcodeState = DEFAULT_STATE, action: IAction) {
  switch(action.type){

    // after fetched picklist detail
    case SET_PART:
      return {
        ...state,
        tube: action.data,
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