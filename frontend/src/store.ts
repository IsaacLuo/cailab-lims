import {createStore} from 'redux'
import reducer from './reducer'

export interface IStoreState {
  loggedIn: boolean,
  username: string,
  profilePicture: string,
  groups: string[],

  loginDialogVisible: boolean,
  
}

/* tslint-disable no-underscore-dangle */

export default createStore(
  reducer,
  (window as any).__REDUX_DEVTOOLS_EXTENSION__ && (window as any).__REDUX_DEVTOOLS_EXTENSION__()
);

/* tslint-enable */