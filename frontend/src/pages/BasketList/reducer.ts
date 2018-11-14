import {
  IAction,
  IBasketState,
} from 'types'

import {
  SET_BASKET_LIST,
  SET_DEFAULT_BASKET,
  FILL_PARTS_INTO_BASKET_LIST,
  SET_A_BASKET_NAME,
} from './actions'

const DEFAULT_STATE:IBasketState = {
  basketList: [],
  defaultBasketId: '',
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

    case FILL_PARTS_INTO_BASKET_LIST:
      const basket = state.basketList.find(v=>v._id===action.data._id)
      if (basket !== undefined) {
        basket.parts = action.data.parts
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