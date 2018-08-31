import * as React from 'react';
import './App.css';
import 'element-theme-default'

import { i18n, Loading } from 'element-react'
import locale from 'element-react/src/locale/lang/en'

i18n.use(locale);


import {Route} from 'react-router'

import Users from './Users'
import NavBar from './NavBar'

import LoginDialog from './LoginDialog'
import ActionPanel from './ActionPanel';
import PartsList from './PartsList';

// redux
import { IStoreState } from './store'
import { Dispatch } from 'redux'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'

interface IProps {
  initializing: boolean,
  dispatchInitialize: () => {},
}

class App extends React.Component<IProps, any> {
  constructor(props:IProps) {
    super(props);
    props.dispatchInitialize();
  }

  public render() {
    if (this.props.initializing ) {
      return <div className="App">
        <Loading fullscreen={true} />
      </div>
    } else {
      return (
        <div className="App">
          <header>
          <NavBar />
          </header>
          <LoginDialog/>
          <Route path='/' exact={true} component={ActionPanel} />
          <Route path='/parts/bacteria' render={this.renderBacteriaComponent} />
          <Route path='/parts/primers' render={this.renderPrimersComponent} />
          <Route path='/parts/yeasts' render={this.renderYeastsComponent} />
          <Route path='/users' component={Users} />
        </div>
      );
    }
  }

  private renderBacteriaComponent = props => <div><PartsList sampleType="bacterium"/></div>
  private renderPrimersComponent = props => <PartsList sampleType="primer"/>
  private renderYeastsComponent = props => <PartsList sampleType="yeast"/>
}


const mapStateToProps = (state :IStoreState) => ({
  loggedIn: state.loggedIn,
  initializing: state.initializing,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  dispatchInitialize: () => dispatch({type: 'INITIALIZE'}),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App))