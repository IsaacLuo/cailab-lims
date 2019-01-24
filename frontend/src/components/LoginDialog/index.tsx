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
import { Dialog, Message } from 'element-react'
import GoogleLogin from 'react-google-login';
import { SEND_GOOGLE_AUTH_INFO_TO_SERVER } from './actions';

export interface IProps {
  dialogVisible: boolean,

  setDialogVisible: (visible:boolean)=>void,
  setLoginInformation: (id:string, name :string, groups: string[]) => void,
  getMyStatus: () => void,
  refreshPartsCount: () => void,
  sendGoogleAuthInfoToServer: (data:any) => void,
}

const mapStateToProps = (state: IStoreState) => ({
  dialogVisible: state.app.loginDialogVisible,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  setDialogVisible: (visible :boolean) => dispatch(ActionLoginDialogVisible(visible)),
  setLoginInformation: (id:string, name :string, groups: string[]) => dispatch(ActionSetLoginInformation(id, name, groups)),
  getMyStatus: ()=>dispatch({type:'GET_MY_STATUS'}),
  refreshPartsCount: () => dispatch({type:'GET_PARTS_COUNT'}),
  sendGoogleAuthInfoToServer: (data:any) => dispatch({type: SEND_GOOGLE_AUTH_INFO_TO_SERVER, data,})

})

class LoginDialog extends React.Component<IProps, any> {
  constructor(props: IProps) {
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
            // uxMode="redirect" // or popup
            // redirectUri="https://lims.cailab.org"
          />
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
}



export default withRouter(connect(mapStateToProps, mapDispatchToProps)(LoginDialog))
