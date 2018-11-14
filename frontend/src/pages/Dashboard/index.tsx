import * as React from 'react'

import Axios from 'axios';
import { serverURL } from '../../config';
import getAuthHeader from '../../authHeader';

// components
import StatisticPanel from 'components/StatisticPanel';

interface IProps {
  dispatchGetMyStatus: ()=>void,
  dispatchGetPartsCount: ()=>void,
}
interface IState {
  message: string,
}

class Dashboard extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {message: ''};
    this.fetchBroadcast();
  }

  public render() {
    return (
      <div>
        <h1>WARNING</h1>
        <p>this is a project still in developing, all data submited to this database might be deleted soon</p>
        <p>version {process.env.REACT_APP_VERSION}{process.env.NODE_ENV}</p>
        <p>{this.state.message}</p>
        <StatisticPanel/>
      </div>
    );
  }

  private fetchBroadcast = async () => {
    try {
      const res = await Axios.get(serverURL + '/api/broadcast', getAuthHeader());
      this.setState({message: res.data.message});
    } catch (err) {
      this.setState({message: 'service unavailable'});
    }
  }
}

export default Dashboard
