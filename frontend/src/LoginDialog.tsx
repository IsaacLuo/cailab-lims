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

import { Dialog, Message } from 'element-react'
import GoogleLogin from 'react-google-login';

import {serverURL, googleAuthURL} from './config';


export interface ILoginDialogProps {
  dialogVisible: boolean,

  setDialogVisible: (visible:boolean)=>void,
  setLoginInformation: (id:string, name :string, groups: string[]) => void,
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
    console.log('login successful');
    console.log(response)
    try {
      const res = await axios.post(
        serverURL + '/api/googleAuth/', 
        {
          token: response.tokenId,
        }
      )
      localStorage.setItem('token',res.data.token);
      localStorage.setItem('tokenTimeStamp', new Date().toLocaleString());
      this.props.setLoginInformation(res.data.id, res.data.name, res.data.groups);
      this.props.setDialogVisible(false);
      Message.success(res.data.message);
    } catch (err) {
      if (err.response) {
        Message.error({message:`${err.response.status}: ${err.response.statusText}`, duration:30000});
      } else {
        Message.error({message:err.toLocaleString()});
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
  setLoginInformation: (id:string, name :string, groups: string[]) => dispatch(ActionSetLoginInformation(id, name, groups)),
  getMyStatus: ()=>dispatch({type:'GET_MY_STATUS'}),
  refreshPartsCount: () => dispatch({type:'GET_PARTS_COUNT'}),

})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(LoginDialog))
