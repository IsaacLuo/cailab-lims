import * as React from 'react';
import './App.css';
import 'element-theme-default'

import { i18n } from 'element-react'
import locale from 'element-react/src/locale/lang/en'

i18n.use(locale);

import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from './store'
import {Route} from 'react-router'

import Users from './Users'
import NavBar from './NavBar'

import LoginDialog from './LoginDialog'
import ActionPanel from './ActionPanel';
import PartsList from './PartsList';

class App extends React.Component<any, any> {
  public render() {
    return (
      <BrowserRouter>
      <Provider store={store}>
      <div className="App">
        <header>
        <NavBar />
        </header>
        <LoginDialog/>
        <Route path='/parts/bacteria' render={this.renderBacteriaComponent} />
        <Route path='/users' component={Users} />
        <ActionPanel/>
      </div>
      </Provider>
      </BrowserRouter>
    );
  }

  private renderBacteriaComponent = props => <PartsList sampleType="bacterium"/>
}

export default App;
