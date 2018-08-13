import * as React from 'react'

// react-router-redux
import { IStoreState } from './store';
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import {ActionLoginDialogVisible} from './actions'


import axios from 'axios'

import { Dialog, Notification } from 'element-react'
import GoogleLogin from 'react-google-login';

import {serverURL, googleAuthURL} from './config';


export interface ILoginDialogProps {
  dialogVisible: boolean,

  setDialogVisible: (visible:boolean)=>void,
}

class LoginDialog extends React.Component<ILoginDialogProps, any> {
  constructor(props: ILoginDialogProps) {
    super(props);
  }

  public render() {
    return (
      <Dialog
        title="Login"
        size="tiny"
        visible={ this.props.dialogVisible }
        onCancel={ this.onCancel }
        lockScroll={ false }
      >
        <Dialog.Body>
          <GoogleLogin
            clientId={googleAuthURL}
            buttonText="Login"
            onSuccess={this.loginSuccessful}
            onFailure={this.loginFailed}
            style={{background:'none'}}
          />
        </Dialog.Body>
      </Dialog>
    );
  }

  private onCancel = () => this.props.setDialogVisible(false)

  private loginSuccessful = async (response :any) => {
    console.log(response)
    try {
      const res = await axios.post(
        serverURL + '/api/googleAuth/', 
        {
          token: response.tokenId,
        }
      )
      Notification({title:'success', message: res.data.message})
      localStorage.setItem('token',res.data.token);
      localStorage.setItem('tokenTimeStamp', new Date().toLocaleString());
    } catch (err) {
      console.error (err)
    }
  }

  private loginFailed = (response :any) => {
    console.warn(response)
  }

}

const mapStateToProps = (state: IStoreState) => ({
  loginDialogVisible: state.loginDialogVisible,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  setDialogVisible: visible => dispatch(ActionLoginDialogVisible(visible)),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(LoginDialog))
