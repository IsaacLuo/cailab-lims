import {
  IAction,
  IPartListState,
} from 'types'

import { NEW_BARCODE_ASSIGNED } from './actions'

const DEFAULT_STATE:IPartListState = {
  currentBasket: undefined,
}

function partListReducer(state :IPartListState = DEFAULT_STATE, action: IAction) {
  switch(action.type){
    case NEW_BARCODE_ASSIGNED:
      return {
        ...state
      }
  }
  return state;
}

export default partListReducer;