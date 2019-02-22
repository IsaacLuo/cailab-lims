/**
 * Login Dialog
 */

// types
import { IStoreState } from 'types';

// react
import * as React from 'react'

// react-router-redux
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import {
  ActionLoginDialogVisible,
} from 'actions/appActions'

import {
  ActionSetLoginInformation,
} from 'actions/userActions'

// tools
import {googleAuthURL} from 'config';

// components
import { Dialog, Message, Input, Button } from 'element-react'
import GoogleLogin from 'react-google-login';
import { 
  SEND_GOOGLE_AUTH_INFO_TO_SERVER,
  SEND_NORMAL_LOGIN_INFO_TO_SERVER,
} from './actions';
import logo from 'img/logo.png';

export interface IProps {
  dialogVisible: boolean,
  busy: boolean,

  setDialogVisible: (visible:boolean)=>void,
  setLoginInformation: (id:string, name :string, groups: string[]) => void,
  getMyStatus: () => void,
  refreshPartsCount: () => void,
  sendGoogleAuthInfoToServer: (data:any) => void,
  sendNormalLoginInfoToServer: (username:string, password:string) => void,
}

interface IState {
  username: string,
  password: string,
}

const mapStateToProps = (state: IStoreState) => ({
  dialogVisible: state.app.loginDialogVisible,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  setDialogVisible: (visible :boolean) => dispatch(ActionLoginDialogVisible(visible)),
  setLoginInformation: (id:string, name :string, groups: string[]) => dispatch(ActionSetLoginInformation(id, name, groups)),
  getMyStatus: ()=>dispatch({type:'GET_MY_STATUS'}),
  refreshPartsCount: () => dispatch({type:'GET_PARTS_COUNT'}),
  sendGoogleAuthInfoToServer: (data:any) => dispatch({type: SEND_GOOGLE_AUTH_INFO_TO_SERVER, data,}),
  sendNormalLoginInfoToServer: (username:string, password:string) => dispatch({type: SEND_NORMAL_LOGIN_INFO_TO_SERVER, data:{username, password}}),
})

class LoginDialog extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    props.getMyStatus();
    this.state = {
      username:'',
      password:''
    };
  }

  public render() {
    return (
      <Dialog
        title=""
        size="tiny"
        visible={this.props.dialogVisible}
        onCancel={ this.onCancel }
        lockScroll={ false }
      >
        <Dialog.Body>
          <img src={logo} style={{marginBottom:20}}/>
          <p>use your username and password</p>
          <Input
            style={{marginBottom:10}}
            placeholder="username"
            value={this.state.username}
            onChange={this.onChangeUsername}
          />
          <Input
            type="password"
            style={{marginBottom:10}}
            placeholder="password"
            value={this.state.password}
            onChange={this.onChangePassword}
            onKeyUp={this.onPasswordKeyUp}
          />
          <Button
            style={{width:190}}
            type="primary"
            size="large"
            onClick={this.onClickLogin}
          >Login</Button>
          <p>or use your google account to login</p>
          <GoogleLogin
            clientId={googleAuthURL}
            buttonText="Google+"
            onSuccess={this.loginSuccessful}
            onFailure={this.loginFailed}
            // uxMode="redirect" // or popup
            // redirectUri="https://lims.cailab.org"
          />
          <p>for users from cailab-database-v1, please use google OAuth</p>
        </Dialog.Body>
      </Dialog>
    );
  }

  private onCancel = () => this.props.setDialogVisible(false)

  private loginSuccessful = async (response :any) => {
    console.log('login successful');
    // console.log(response)
    this.props.sendGoogleAuthInfoToServer(response);
  }

  private loginFailed = (response :any) => {
    console.warn(response);
    if(response.error) {
      alert(response.error);
    }
  }

  private onChangeUsername = (username) => {
    this.setState({username});
  }

  private onChangePassword = (password) => {
    this.setState({password});
  }
  
  private onPasswordKeyUp = (event) => {
    if (event.keyCode === 13) {
      this.onClickLogin();
    }
  }

  private onClickLogin = () => {
    const {username, password} = this.state;
    this.props.sendNormalLoginInfoToServer(username, password)
  }
}



export default withRouter(connect(mapStateToProps, mapDispatchToProps)(LoginDialog))
