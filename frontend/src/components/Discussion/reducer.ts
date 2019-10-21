import {
  IAction,
  IDiscussionState,
} from '../../types'

import {
  SET_COMMENT_LIST, SET_NEW_COMMENT_TEXT,
} from './actions'

const DEFAULT_STATE:IDiscussionState = {
  comments: [],
  newCommentText: '',
}

function discussionReducer(state :IDiscussionState = DEFAULT_STATE, action: IAction) {
  switch(action.type){
    case SET_COMMENT_LIST:
      return {
        ...state,
        comments: action.data.comments,
      }
    case SET_NEW_COMMENT_TEXT:    
      return {
        ...state,
        newCommentText: action.data,
      }
  }
  return state;
}

export default discussionReducer;