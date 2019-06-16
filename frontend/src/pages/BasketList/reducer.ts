import {
  IAction,
  IBasketState,
} from 'types'

import {
  SET_BASKET_LIST,
  SET_DEFAULT_BASKET_ID,
  FILL_PARTS_INTO_BASKET_LIST,
  SET_A_BASKET_NAME,
  SET_CURRENT_BASKET_ID,
} from './actions'

const DEFAULT_STATE:IBasketState = {
  basketList: [],
  defaultBasketId: '',
  currentBasket:undefined,
}

function basketReducer(state :IBasketState = DEFAULT_STATE, action: IAction) {
  switch(action.type){
    case SET_BASKET_LIST:
      return {
        ...state,
        basketList: action.data,
      }

    case SET_DEFAULT_BASKET_ID:
      return {
        ...state,
        defaultBasketId: action.data,
        currentBasket: state.currentBasket || state.basketList.find(v=>v._id === action.data),
      }

    case SET_CURRENT_BASKET_ID:
        return {
          ...state,
          currentBasket: state.basketList[action.data],
        }

    case FILL_PARTS_INTO_BASKET_LIST:
      const basket = state.basketList.find(v=>v._id===action.data._id)
      if (basket !== undefined) {
        basket.parts = action.data.parts;
        basket.partsCount = action.data.parts.length;
      }
      return {
        ...state,
        basketList: [...state.basketList],
      }
    
    case SET_A_BASKET_NAME:
      return {
        ...state,
        basketList: state.basketList.map(
          v => v._id === action.data.basketId? {...v, name: action.data.basketName} : v
          )
      }


  }
  return state;
}

export default basketReducer;