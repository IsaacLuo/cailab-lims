import {createStore, applyMiddleware} from 'redux'
import reducer from './reducer'
import saga from './saga'
import createSagaMiddleware from 'redux-saga'
import {IUserInfo} from './types'
import {IPart} from './types'


interface IPartsCount {
  bacteria: number,
  primers: number,
  yeasts: number,
}

export interface IStoreState {

  initializing: boolean,

  // UI visible controls
  loginDialogVisible: boolean,
  newPartDialogVisible: boolean,

  // UI content
  renderingParts: IPart[],

  // user state controls
  loggedIn: boolean,
  userId: string,
  fullName: string,
  profilePicture: string,
  groups: string[],
  
  // parts information
  partsCount: IPartsCount,
  allUsers: IUserInfo[],

  redirect?: string,
  
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