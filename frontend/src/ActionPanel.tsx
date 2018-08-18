import * as React from 'react'

// react-router-redux
import { IStoreState } from './store';
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { Button } from 'element-react'
interface IProps {
  dispatchGetMyStatus: ()=>void,
}

class LoginDialog extends React.Component<IProps, any> {
  constructor(props: IProps) {
    super(props);
  }

  public render() {
    return (
      <div>
        <Button onClick={this.props.dispatchGetMyStatus} >getMyStatus</Button>
      </div>
    );
  }
}

const mapStateToProps = (state: IStoreState) => ({
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  dispatchGetMyStatus: () => dispatch({type: 'GET_MY_STATUS'}),
  // setLoginInformation: (name :string, groups: string[]) => dispatch(ActionSetLoginInformation(name, groups)),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(LoginDialog))
