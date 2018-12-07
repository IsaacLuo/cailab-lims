import {
  IAction,
  IPartListState,
} from 'types'

import {
  // SET_CURRENT_BASKET,
} from './actions'

const DEFAULT_STATE:IPartListState = {
  currentBasket: undefined,
}

function partListReducer(state :IPartListState = DEFAULT_STATE, action: IAction) {
  switch(action.type){
  }
  return state;
}

export default partListReducer;