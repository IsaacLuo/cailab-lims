import {createStore, applyMiddleware} from 'redux'
import reducer from './reducer'
import saga from './saga'
import createSagaMiddleware from 'redux-saga'
import {IUserInfo} from './types'
import {IPart} from './types'
import { getDefaultSettings } from 'http2';
import { string } from 'prop-types';


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

  currentBasket: any,
  basketList: any[],
  defaultBasket:string,
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
  currentBasket: {},
  basketList:[],
  defaultBasket:'',
}

/* tslint-disable no-underscore-dangle */

const sagaMiddleware = createSagaMiddleware();
let middleWare:any;
if (process.env.NODE_ENV === 'development') {
  const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ;
  middleWare = composeEnhancers(applyMiddleware(sagaMiddleware));
} else {
  middleWare = applyMiddleware(sagaMiddleware);
}

const store = createStore(
    reducer,
    middleWare,
  );
sagaMiddleware.run(saga);

export default store;

/* tslint-enable */