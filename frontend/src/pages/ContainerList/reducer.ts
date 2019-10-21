import {
  IAction,
  IPartListState,
  IContainerState,
} from '../../types'

import {
  SET_CONTAINER_LIST,
  SET_SKIP,
  SET_LIMIT,
  SET_LOADING,
} from './actions'

const DEFAULT_STATE:IContainerState = {
  containers: [],
  skip: 0,
  limit: 10,
  total: 0,
  loading: true,
}

function partListReducer(state :IContainerState = DEFAULT_STATE, action: IAction) {
  switch(action.type){
    case SET_CONTAINER_LIST:
      return {
        ...state,
        containers: action.data.containers,
        total: action.data.total,
        loading: false,
      }
    case SET_LOADING:
      return {
        ...state,
        loading: action.data
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
