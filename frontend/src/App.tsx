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
import StatisticPanel from './StatisticPanel';
import PartsList from './PartsList';

// redux
import { IStoreState } from './store'
import { Dispatch } from 'redux'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import UploadParts from './UploadParts';
import DeletionRequestsList from 'DeletionRequestsList';
import EditPartDialog from 'EditPartDialog';
// import SystemNotification from 'SystemNotification';

interface IProps {
  initializing: boolean,
  redirect: string,
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
          <EditPartDialog/>
          {/* {this.props.redirect && <MyRedirect/>} */}
          <Route path='/' exact={true} component={StatisticPanel} />
          <Route path='/parts/bacteria/' exact={true} render={this.renderBacteriaComponent} />
          <Route path='/parts/primers/' exact={true} render={this.renderPrimersComponent} />
          <Route path='/parts/yeasts/' exact={true} render={this.renderYeastsComponent} />
          <Route path='/parts/bacteria/upload' exact={true} render={this.renderBacteriaUpload} />
          <Route path='/requests/partsDeletion' exact={true} component={DeletionRequestsList} />
          <Route path='/users/' component={Users} />
        </div>
      );
    }
  }

  private renderBacteriaComponent = props => <PartsList sampleType="bacterium"/>
  private renderPrimersComponent = props => <PartsList sampleType="primer"/>
  private renderYeastsComponent = props => <PartsList sampleType="yeast"/>
  private renderBacteriaUpload = props => <UploadParts sampleType="bacterium" returnTo="/parts/bacteria"/>
  private renderPrimerUpload = props => <UploadParts sampleType="primer" returnTo="/parts/primer"/>
  private renderYeastUpload = props => <UploadParts sampleType="yeast" returnTo="/parts/yeast"/>
}


const mapStateToProps = (state :IStoreState) => ({
  loggedIn: state.loggedIn,
  initializing: state.initializing,
  redirect: state.redirect,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  dispatchInitialize: () => dispatch({type: 'INITIALIZE'}),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App))