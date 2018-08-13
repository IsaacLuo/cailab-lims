import {createStore} from 'redux'
import reducer from './reducer'

export interface IStoreState {
  loggedIn: boolean,
  username: string,
  profilePicture: string,
  groups: string[],
}

export default createStore(
  reducer,
  {
    loggedIn: false,
    username: 'guest',
    profilePicture: '',
    groups: [],
  }
);