import * as React from 'react'

// react-router-redux
import { IStoreState } from './store';
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import {
  ActionLoginDialogVisible,
  ActionSetLoginInformation,
} from './actions'


import axios from 'axios'

import { Dialog, Notification } from 'element-react'
import GoogleLogin from 'react-google-login';

import {serverURL, googleAuthURL} from './config';


export interface ILoginDialogProps {
  dialogVisible: boolean,

  setDialogVisible: (visible:boolean)=>void,
  setLoginInformation: (name :string, groups: string[]) => void,
  getMyStatus: () => void,
  refreshPartsCount: () => void,
}

class LoginDialog extends React.Component<ILoginDialogProps, any> {
  constructor(props: ILoginDialogProps) {
    super(props);
    props.getMyStatus();
  }

  public render() {
    return (
      <Dialog
        title="Login"
        size="tiny"
        visible={this.props.dialogVisible}
        onCancel={ this.onCancel }
        lockScroll={ false }
      >
        <Dialog.Body>
          <p>Use your google account to login</p>
          <GoogleLogin
            clientId={googleAuthURL}
            buttonText="Login"
            onSuccess={this.loginSuccessful}
            onFailure={this.loginFailed}
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
      this.props.setDialogVisible(false);
      this.props.setLoginInformation(res.data.name, res.data.groups);
      this.props.refreshPartsCount();
    } catch (err) {
      if (err.response) {
        Notification.error({title:'error', message:`${err.response.status}: ${err.response.statusText}`, duration:30000});
      } else {
      Notification.error({title:'error', message:err.toLocaleString()});
      }
    }
  }

  private loginFailed = (response :any) => {
    console.warn(response)
  }
}

const mapStateToProps = (state: IStoreState) => ({
  dialogVisible: state.loginDialogVisible,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  setDialogVisible: (visible :boolean) => dispatch(ActionLoginDialogVisible(visible)),
  setLoginInformation: (name :string, groups: string[]) => dispatch(ActionSetLoginInformation(name, groups)),
  getMyStatus: ()=>dispatch({type:'GET_MY_STATUS'}),
  refreshPartsCount: () => dispatch({type:'GET_PARTS_COUNT'}),

})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(LoginDialog))
