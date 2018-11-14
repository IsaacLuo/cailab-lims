import {createStore, applyMiddleware} from 'redux'
import reducer from './reducers'
import saga from './saga'
import createSagaMiddleware from 'redux-saga'

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