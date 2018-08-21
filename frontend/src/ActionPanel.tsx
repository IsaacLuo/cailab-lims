import * as React from 'react'

// react-router-redux
import { IStoreState } from './store';
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { Button } from 'element-react'
import Axios from 'axios';
import { serverURL } from './config';
import getAuthHeader from './authHeader';

interface IProps {
  dispatchGetMyStatus: ()=>void,
  dispatchGetPartsCount: ()=>void,
}
interface IState {
  message: string,
}

class ActionPanel extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {message: ''};
  }

  public render() {
    return (
      <div style={{background:'#aaa'}}>
        <div>action panel</div>
        <Button onClick={this.props.dispatchGetMyStatus} >GET_MY_STATUS</Button>
        <Button onClick={this.getPartList} >getPartList</Button>
        <Button onClick={this.props.dispatchGetPartsCount} >GET_PARTS_COUNT</Button>
        <div style={{textAlign:'left'}}><pre>{this.state.message}</pre></div>
      </div>
    );
  }

  private getPartList = async () => {
    const res = await Axios.get(serverURL + '/api/parts', getAuthHeader());
    this.setState({message: JSON.stringify(res.data, null, 4)});
  }
}

const mapStateToProps = (state: IStoreState) => ({
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  dispatchGetMyStatus: () => dispatch({type: 'GET_MY_STATUS'}),
  dispatchGetPartsCount: () => dispatch({type: 'GET_PARTS_COUNT'}),
  
  // setLoginInformation: (name :string, groups: string[]) => dispatch(ActionSetLoginInformation(name, groups)),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(ActionPanel))
