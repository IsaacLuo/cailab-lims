import {
  IAction,
  IPartListState,
} from 'types'

import {
  SET_CURRENT_BASKET,
} from './actions'

const DEFAULT_STATE:IPartListState = {
  currentBasket: undefined,
}

function basketReducer(state :IPartListState = DEFAULT_STATE, action: IAction) {
  switch(action.type){
    case SET_CURRENT_BASKET:
      return {
        ...state,
        currentBasket: action.data,
      }
  }
  return state;
}

export default basketReducer;