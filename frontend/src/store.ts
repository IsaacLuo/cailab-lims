import {createStore, applyMiddleware} from 'redux'
import reducer from './reducer'
import saga from './saga'
import createSagaMiddleware from 'redux-saga'
import {IUserInfo} from './types'


interface IPartsCount {
  bacteria: number,
  primers: number,
  yeasts: number,
}

export interface IStoreState {
  loggedIn: boolean,
  username: string,
  fullName: string,
  profilePicture: string,
  groups: string[],
  loginDialogVisible: boolean,
  partsCount: IPartsCount,
  allUsers: IUserInfo[],
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