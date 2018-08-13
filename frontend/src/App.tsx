import * as React from 'react';
import './App.css';
import logo from './logo.svg';

import 'element-theme-default'

import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from './store'
import {Route} from 'react-router'

import Users from './Users'
import NavBar from './NavBar'

import LoginDialog from './LoginDialog'

class App extends React.Component {
  public render() {
    return (
      <BrowserRouter>
      <Provider store={store}>
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <NavBar />
        <LoginDialog/>
        <Route path='/users' component={Users} />
      </div>
      </Provider>
      </BrowserRouter>
    );
  }
}

export default App;
