import {
  IAction,
  IPartListState,
} from 'types'

import {
  SET_CURRENT_BASKET,
} from './actions'

const DEFAULT_STATE:IPartListState = {
  currentBasket: undefined,
  searchKeyword: '',
  userFilter: '',
  skip: 0,
  limit: 0,
  total: 0,
  sortMethod: {
    order: 'desc',
    prop: '_id',
  },
  parts: [],
}

function partListReducer(state :IPartListState = DEFAULT_STATE, action: IAction) {
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