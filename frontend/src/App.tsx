/**
 * @file main component
 * 
 * APP
 *  ├ NavBar
 *  ├ LoginDialog
 *  ├ Dashboard
 *  │ └ StatisticPanel
 *  ├ PartList
 *  │ └ EditPartDialog
 *  ├ UploadParts
 *  ├ DeletionRequestList
 *  └ Users
 * 
 *  abandoned components:
 *  NewPartDialog
 *  TagInput
 */

// react
import * as React from 'react';

// main CSS
import './App.css';

// element UI locale
import 'element-theme-default'
import { i18n, Loading } from 'element-react'
import locale from 'element-react/src/locale/lang/en'
i18n.use(locale);

// react redux router
import {Route} from 'react-router'
import { IStoreState } from './types'
import { Dispatch } from 'redux'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'

// components
import Users from 'components/Users'
import NavBar from 'components/NavBar'
import LoginDialog from './components/LoginDialog'
import UploadParts from 'pages/UploadParts';
import DeletionRequestsList from 'pages/DeletionRequestsList';
import Dashboard from 'pages/Dashboard';
import BasketList from 'pages/BasketList';
import AssignTubes from 'pages/AssignTubes';
import SearchTubeBarcode from 'pages/SearchTubeBarcode';
import SearchRackBarcode from 'pages/SearchRackBarcode';
import Part from 'pages/Part';
import PartList from 'pages/PartList';
import BateriumPartList from 'pages/PartList/BacteriumPartList.tsx'
import PrimerPartList from 'pages/PartList/PrimerPartList';
import YeastPartList from 'pages/PartList/YeastPartList';
import ContainerList from 'pages/ContainerList';
import {hot} from 'react-hot-loader/root';
import RegisterUser from 'pages/RegisterUser';

interface IProps {
  initializing: boolean,
  dispatchInitialize: () => {},
  dispatchGetMyStatus: () => {},
}

class App extends React.Component<IProps, any> {
  private intervalHandle:any;

  constructor(props:IProps) {
    super(props);
    props.dispatchInitialize();
  }

  public componentDidMount() {
    // timer to refresh currentUser
    console.log('app mount');
    this.intervalHandle = setInterval(()=>{
      this.props.dispatchGetMyStatus();
    }, 600000);
  }

  public componentWillUnmount() {
    console.log('app unmount');
    clearInterval(this.intervalHandle);
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
          <Route path='/' exact={true} component={Dashboard} />

          <Route path='/parts/all/' exact={true} component={PartList} />
          <Route path='/parts/bacteria/' exact={true} component={BateriumPartList} />
          <Route path='/parts/primers/' exact={true} component={PrimerPartList} />
          <Route path='/parts/yeasts/' exact={true} component={YeastPartList} />
          
          <Route path='/parts/bacteria/upload' exact={true} render={this.renderBacteriaUpload} />
          <Route path='/parts/primers/upload' exact={true} render={this.renderPrimersUpload} />
          <Route path='/parts/yeasts/upload' exact={true} render={this.renderYeastsUpload} />

          <Route path='/tasks/assignTubes' exact={true} component={AssignTubes} />
          <Route path='/tasks/searchTubeBarcode/' exact={true} component={SearchTubeBarcode} />
          <Route path='/tasks/searchTubeBarcode/:barcode' component={SearchTubeBarcode} />
          <Route path='/tasks/searchRackBarcode/' exact={true} component={SearchRackBarcode} />
          <Route path='/tasks/searchRackBarcode/:barcode' component={SearchRackBarcode} />

          <Route path='/part/:id' component={Part} />

          <Route path='/requests/partsDeletion' exact={true} component={DeletionRequestsList} />
          <Route path='/users/' component={Users} />
          <Route path='/myBasket/' component={BasketList} />

          <Route path='/containers/' exact={true} component={ContainerList} />
          <Route path='/register/' exact={true} component={RegisterUser} />

        </div>
      );
    }
  }

  private renderBacteriaUpload = props => <UploadParts sampleType="bacterium" returnTo="/parts/bacteria"/>
  private renderPrimersUpload = props => <UploadParts sampleType="primer" returnTo="/parts/primers"/>
  private renderYeastsUpload = props => <UploadParts sampleType="yeast" returnTo="/parts/yeasts"/>
}


const mapStateToProps = (state :IStoreState) => ({
  loggedIn: state.user.loggedIn,
  initializing: state.app.initializing,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  dispatchInitialize: () => dispatch({type: 'INITIALIZE'}),
  dispatchGetMyStatus: () => dispatch({type: 'GET_MY_STATUS'}),
})

// export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App))
export default hot(withRouter(connect(mapStateToProps, mapDispatchToProps)(App)))