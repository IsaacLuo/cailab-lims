import {
  IAction,
  IPartListState,
} from 'types'

import {
  SET_CURRENT_BASKET,
} from './actions'

const DEFAULT_STATE:any = {
  currentBasket: undefined,
}

function partListReducer(state :any = DEFAULT_STATE, action: IAction) {
  switch(action.type){
    case SET_CURRENT_BASKET:
      return {
        ...state,
        currentBasket: action.data,
      }
  }
  return state;
}

export default partListReducer;