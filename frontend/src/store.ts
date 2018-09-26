import {createStore, applyMiddleware} from 'redux'
import reducer from './reducer'
import saga from './saga'
import createSagaMiddleware from 'redux-saga'
import {IUserInfo} from './types'
import {IPart} from './types'
import { getDefaultSettings } from 'http2';


interface IPartsCount {
  bacteria: number,
  primers: number,
  yeasts: number,
}

export interface IStoreState {

  // the app is initializing(fetching data from server first time)
  initializing: boolean,

  // ===dialogs visible controls===
  loginDialogVisible: boolean,
  newPartDialogVisible: boolean,
  editPartDialogVisible: boolean,

  // ===user state controls===
  loggedIn: boolean,
  userId: string,
  fullName: string,
  profilePicture: string,
  groups: string[],
  
  // parts information
  partsCount: IPartsCount,

  // all user names, used in user filter combo box
  allUsers: IUserInfo[],

  // edit dialog information  
  editPartDialogPartId: string,
}

export const defaultStoreState:IStoreState = {
  initializing: true,
  loggedIn: false,
  userId: 'guest',
  fullName: 'guest',
  profilePicture: '',
  groups: [],
  loginDialogVisible: false,
  partsCount: {
    bacteria: 0,
    primers: 0,
    yeasts: 0,
  },
  allUsers: [],
  newPartDialogVisible: false,
  editPartDialogVisible: false,
  editPartDialogPartId: '',
}

/* tslint-disable no-underscore-dangle */

const sagaMiddleware = createSagaMiddleware();
const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ;
const store = createStore(
    reducer,
    composeEnhancers(applyMiddleware(sagaMiddleware)),
  );
sagaMiddleware.run(saga);

export default store;

// export default createStore(
//   reducer,
//   // (window as any).__REDUX_DEVTOOLS_EXTENSION__ && (window as any).__REDUX_DEVTOOLS_EXTENSION__(
//   //   applyMiddleware(createSagaMiddleware(saga))
//   // )

// );

/* tslint-enable */