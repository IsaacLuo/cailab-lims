import {
  IAction,
  ILoginDialogState,
} from 'types'

import {
  SET_BUSY
} from './actions'

const DEFAULT_STATE:ILoginDialogState = {
  busy:false,
}

function partListReducer(state :ILoginDialogState = DEFAULT_STATE, action: IAction) {
  switch(action.type){
    case SET_BUSY:
      return {
        ...state,
        busy: action.data,
      }
  }
  return state;
}

export default partListReducer;