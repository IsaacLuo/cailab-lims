import {
  IAction,
  IBasketState,
} from 'types'

import {
  SET_BASKET_LIST,
  SET_DEFAULT_BASKET,
} from './actions'

const DEFAULT_STATE:IBasketState = {
  basketList: [],
  defaultBasketId: '',
  currentBasket: {
    _id: '',
    partsCount: 0,
  }
}

function basketReducer(state :IBasketState = DEFAULT_STATE, action: IAction) {
  switch(action.type){
    case SET_BASKET_LIST:
      return {
        ...state,
        basketList: action.data,
      }

    case SET_DEFAULT_BASKET:
      return {
        ...state,
        defaultBasketId: action.data,
      }
  }
  return state;
}

export default basketReducer;