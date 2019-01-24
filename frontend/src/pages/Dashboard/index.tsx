import * as React from 'react'

// types
import { IStoreState, IReactRouterProps } from 'types';

import Axios from 'axios';
import { serverURL } from '../../config';
import getAuthHeader from '../../authHeader';

// redux
import { Dispatch } from 'redux'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'

// components
import StatisticPanel from 'components/StatisticPanel';
import { Input } from 'element-react';
import { SEARCH_PART } from 'pages/PartsList/actions';


interface IProps extends IReactRouterProps {
  loggedIn: boolean,
  dispatchSearchPart: (key:string) => void,
}
interface IState {
  message: string,
  searchKey: string,
}

const mapStateToProps = (state :IStoreState) => ({
  loggedIn: state.user.loggedIn,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  dispatchSearchPart : (key:string) => dispatch({type:SEARCH_PART, data: {key, skip:0, limit:0}}),
})

class Dashboard extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      message: '',
      searchKey: '',
    };
    this.fetchBroadcast();
  }

  public render() {
    return (
      <div>
        <h1>WARNING</h1>
        <p>this is a project still in developing, all data submited to this database might be deleted soon</p>
        <p>version {process.env.REACT_APP_VERSION}{process.env.NODE_ENV}</p>
        <p>{this.state.message}</p>
        {
          this.props.loggedIn &&
          <div className="centralizedPanel">
            <h1>search part</h1>
            <Input
              value={this.state.searchKey}
              onChange={this.onSearchInputChange}
              onKeyUp={this.onSearchInputKeyUp}
            />
          </div>
        }
        <StatisticPanel/>
      </div>
    );
  }

  private onSearchInputChange = searchKey => {
    this.setState({searchKey});
  }

  private onSearchInputKeyUp = event => {
    if (event.keyCode === 13) {
      // this.props.dispatchSearchPart(this.state.searchKey);
      this.props.history.push(`/parts/search/${this.state.searchKey}`);
    }
  };

  private fetchBroadcast = async () => {
    try {
      const res = await Axios.get(serverURL + '/api/broadcast', getAuthHeader());
      this.setState({message: res.data.message});
    } catch (err) {
      this.setState({message: 'service unavailable'});
    }
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Dashboard))
