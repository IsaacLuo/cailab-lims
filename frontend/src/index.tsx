import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
import './index.css';
import registerServiceWorker from './registerServiceWorker';

import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from './store'


function registerHMR() {
  type ModuleHMR = typeof module & {
    hot?: {
      accept(dependencies: string | string[], callback: (updatedDependencies: any[]) => void): void
    }
  };
  if ((module as ModuleHMR).hot) {
    (module as ModuleHMR).hot!.accept('./App', () => {
      ReactDOM.render(
        <App />,
        document.getElementById('root') as HTMLElement
      );
    });
  }
}

ReactDOM.render(
  <BrowserRouter>
    <Provider store={store}>
      <App />
    </Provider>
  </BrowserRouter>
  ,
  document.getElementById('root') as HTMLElement
);

// if (module.hot) {
//   module.hot.accept('./App', () => {
//       const NextApp = require('./App').default;
//       ReactDOM.render(
//           <NextApp />,
//           document.getElementById('root') as HTMLElement
//       );
//   });
// }

registerServiceWorker();
registerHMR();