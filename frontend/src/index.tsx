import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
import './index.css';
import registerServiceWorker from './registerServiceWorker';

import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from './store'


registerServiceWorker();

const render = (Component: any) => {
  return ReactDOM.render(
    <Provider store={store}>
      <BrowserRouter>
        <Component />
      </BrowserRouter>
    </Provider>
    ,
    document.getElementById('root') as HTMLElement
  );
};

render(App);

if (process.env.NODE_ENV === 'production' && module.hot) {
  module.hot.accept('./App', () => {
    const NextApp = require('./App').default;
    render(NextApp);
  });
}
// registerHMR();