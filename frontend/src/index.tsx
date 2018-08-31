import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
import './index.css';
import registerServiceWorker from './registerServiceWorker';

import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from './store'

ReactDOM.render(
  <BrowserRouter>
    <Provider store={store}>
      <App />
    </Provider>
  </BrowserRouter>
  ,
  document.getElementById('root') as HTMLElement
);

if (module.hot) {
  module.hot.accept('./App', () => {
      const NextApp = require('./App').default;
      ReactDOM.render(
          <NextApp />,
          document.getElementById('root') as HTMLElement
      );
  });
}

registerServiceWorker();
