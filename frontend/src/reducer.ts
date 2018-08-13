import {IStoreState} from './store'
import {IAction, LOGIN_DIALOG_VISIBLE} from './actions'

function myReducer(state :IStoreState = {
  loggedIn: false,
  username: 'guest',
  profilePicture: '',
  groups: [],
  loginDialogVisible: false,
}, action: IAction) {
  switch (action.type) {
    case LOGIN_DIALOG_VISIBLE:
      return {...state, loginDialogVisible: action.data.visible}
  }
  return state;
}

export default myReducer