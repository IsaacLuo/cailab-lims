import {
  IAction,
  IPartListState,
} from 'types'

import {
  SET_CURRENT_BASKET,
  SET_SEARCH_PARTS_RESULT,
  SET_LOADING,
  SET_SKIP,
  SET_LIMIT,
  SET_SEARCH_FILTER
} from './actions'

const DEFAULT_STATE:IPartListState = {
  currentBasket: undefined,
  loading: true,
  sampleType: '',
  searchKeyword: '',
  userFilter: '',
  skip: 0,
  limit: 10,
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
    case SET_LOADING:
      return {
        ...state,
        loading: action.data
      }
    case SET_SEARCH_PARTS_RESULT:
      return {
        ...state,
        parts: action.data.parts,
        total: action.data.count,
        loading: false,
      }
    
    case SET_SEARCH_FILTER:
      return {
        ...state,
        ...action.data,
      }

    case SET_SKIP:
      return {
        ...state,
        skip: action.data,
      }
    case SET_LIMIT:
      return {
        ...state,
        limit: action.data,
      }
  }
  return state;
}

export default partListReducer;