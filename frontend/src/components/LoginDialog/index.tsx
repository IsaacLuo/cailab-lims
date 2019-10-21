/**
 * Login Dialog
 */

// types
import { IStoreState } from '../../types';

// react
import * as React from 'react'

// react-router-redux
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import {
  ActionLoginDialogVisible,
} from '../../actions/appActions'

import {
  SET_LOGIN_INFORMATION,
} from '../../actions/userActions'

// tools
import {googleAuthURL, cailabAuthURL} from '../../config';

// components
import { Dialog, Message, Input, Button } from 'element-react'
import GoogleLogin from 'react-google-login';
import { 
  SEND_GOOGLE_AUTH_INFO_TO_SERVER,
  SEND_NORMAL_LOGIN_INFO_TO_SERVER,
  SEND_CAILAB_LOGIN_INFO_TO_SERVER,
} from './actions';
import logo from 'img/logo.png';
import {Link} from 'react-router-dom'

export interface IProps {
  dialogVisible: boolean,
  busy: boolean,

  setDialogVisible: (visible:boolean)=>void,
  setLoginInformation: (id:string, name :string, email: string, groups: string[]) => void,
  getMyStatus: () => void,
  refreshPartsCount: () => void,
  sendGoogleAuthInfoToServer: (data:any) => void,
  sendNormalLoginInfoToServer: (username:string, password:string) => void,
  sendCailabAuthInfoToServer: ()=> void,
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
  setLoginInformation: (id:string, name :string, email: string, groups: string[]) => dispatch({type: SET_LOGIN_INFORMATION, data:{id, name, groups, email}}),
  getMyStatus: ()=>dispatch({type:'GET_MY_STATUS'}),
  refreshPartsCount: () => dispatch({type:'GET_PARTS_COUNT'}),
  sendGoogleAuthInfoToServer: (data:any) => dispatch({type: SEND_GOOGLE_AUTH_INFO_TO_SERVER, data,}),
  sendNormalLoginInfoToServer: (username:string, password:string) => dispatch({type: SEND_NORMAL_LOGIN_INFO_TO_SERVER, data:{username, password}}),
  sendCailabAuthInfoToServer: ()=>dispatch({type: SEND_CAILAB_LOGIN_INFO_TO_SERVER}),
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
          <p>cailab login</p>
          {/* <a href={`${cailabAuthURL}/login`}> */}
            <Button
              style={{width:190}}
              size="large"
              onClick={this.onClickCailabLogin}
            >Cailab Login</Button>
          {/* </a> */}
          <p>or use your google account to login</p>
          <GoogleLogin
            clientId={googleAuthURL}
            buttonText="Google Login"
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
    console.warn('google login failed', response);
    if(response.error) {
      alert(response.error);
    }
  }

  private onClickCailabLogin = async () => {
    const width = 400;
    const height = 560;
    const top = (screen.availHeight / 2) - (height / 2);
    const left = (screen.availWidth / 2) - (width / 2);

    window.addEventListener('message', this.onLogginWindowClosed, false);
    const subWindow = window.open(
      'https://auth.cailab.org/login',
      'cailablogin',
// tslint:disable-next-line: max-line-length
      `toolbar=no,location=no,status=no,menubar=no,scrollbar=yes,resizable=yes,width=${width},height=${height},top=${top},left=${left}`,
    );
  }

  private onLogginWindowClosed = (messageEvent: MessageEvent) => {
    const {origin, data} = messageEvent;
    if (data.event === 'closed' && data.success === true) {
      console.log('logged in by cailab auth');
      // now token is in cookie
      this.props.sendCailabAuthInfoToServer()
    }
    window.removeEventListener('message', this.onLogginWindowClosed);
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

  private onClickRegister = () => {
    this.props.setDialogVisible(false);
  }
}



export default withRouter(connect(mapStateToProps, mapDispatchToProps)(LoginDialog))
