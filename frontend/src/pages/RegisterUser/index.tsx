/**
 * Register page with dialog
 */

// types
import { IStoreState, IReactRouterProps } from 'types';

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
import {googleAuthURL, serverURL} from 'config';

// components
import { Dialog, Message, Input, Button } from 'element-react'
import GoogleLogin from 'react-google-login';
import { 
  REGISTER,
} from './actions';
import logo from 'img/logo.png';
import {Link} from 'react-router-dom'
import styled from 'styled-components'
import Axios from 'axios';
import getAuthHeader from 'authHeader';

const Row = styled.div`
  display:flex;
  align-items:center;
`

export interface IProps extends IReactRouterProps {
  fullName: string,
  username: string,
}

interface IState {
  userId: string,
  username: string,
  password: string,
  password2: string,
  fullName: string,
  abbr: string,
  message: string,
}

const mapStateToProps = (state: IStoreState) => ({
  username: state.user.email,
  fullName: state.user.name,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({

})

class LoginDialog extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      userId: '',
      username: props.username,
      password:'',
      password2: '',
      fullName: props.fullName === 'guest' ? '' : props.fullName,
      abbr: '',
      message: '',
    };
    if (props.username) {
      (async ()=>{
        // user logged in, get details.
        const res = await Axios.get(serverURL + '/api/currentUser/detail/', getAuthHeader());
        this.setState({
          userId: res.data._id,
          abbr: res.data.abbr,
        });
      })();
    }
  }

  public render() {
    return (
      <Dialog
        title=""
        visible={true}
        size="tiny"
        onCancel={ this.onCancel }
        lockScroll={ false }
      >
        <Dialog.Body>
          <img src={logo} style={{marginBottom:20}}/>
          
          <Input
            style={{marginBottom:10}}
            prepend="email address"
            value={this.state.username}
            onChange={this.onChangeUsername}
          />
          <Input
            type="password"
            style={{marginBottom:10}}
            prepend="password"
            value={this.state.password}
            onChange={this.onChangePassword}
          />
          <Input
            type="password"
            style={{marginBottom:10}}
            prepend="password again"
            value={this.state.password2}
            onChange={this.onChangePassword2}
          />
          <Input
            style={{marginBottom:10}}
            prepend="full name"
            value={this.state.fullName}
            onChange={this.onChangeFullName}
          />
          <Input
            style={{marginBottom:10}}
            prepend="abbr"
            value={this.state.abbr}
            onChange={this.onChangeAbbr}
          />
          <p>{this.state.message}</p>
          <Button
            style={{width:190}}
            type="primary"
            size="large"
            onClick={this.onClickRegister}
          >submit</Button>
        </Dialog.Body>
      </Dialog>
    );
  }

  private onCancel = () => {
    this.props.history.push('/');
  }

  private loginSuccessful = async (response :any) => {
    console.log('login successful');
    // console.log(response)
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

  private onChangePassword2 = (password2) => {
    this.setState({password2});
  }

  private onChangeFullName = (fullName) => {
    console.log(fullName)
    let abbr = fullName.split(' ').map(v=>v ? v[0] : '').join('').toUpperCase();
    if (abbr.length < 2) {
      abbr = '';
    } else if (abbr.length > 2) {
      abbr = abbr[0] + abbr[abbr.length-1];
    }
    this.setState({fullName, abbr});
  }
  
  private onChangeAbbr = (abbr) => {
    this.setState({abbr});
  }

  private onClickRegister = async () => {
    const {
      userId,
      username,
      password,
      password2,
      fullName,
      abbr
    } = this.state;

    let pass = true;
    let message = '';
    if (username.length < 6) {
      pass = false;
      message += 'username is too short. ';
    }

    if (userId === '' || password.length > 0) {

      if (password.length < 8) {
        pass = false;
        message += 'password is too short. ';
      }

      if (!(
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password)
        )) {
        pass = false;
        message += 'password is not complex enough. ';
      }

    }

    if(password.length > 0) {
      if (password2 !== password) {
        pass = false;
        message += 'passwords not match. ';
      }
    }

    if (!/^[A-Z]{2}$/.test(abbr)) {
      pass = false;
      message += 'abbr shoule be 2 capital letters. '
    }

    if (pass) {
      this.setState({message: 'submitting'});
      try {
        if(userId === '') {
          await Axios.post(serverURL + '/api/user/', {
            name: fullName,
            email: username,
            password: password,
            abbr,
          });
        } else {
          await Axios.put(serverURL + '/api/user/' + userId, {
            name: fullName,
            email: username,
            password: (password.length > 0 ? password : undefined),
            abbr,
          });
        }
        this.setState({message: ''});
        this.props.history.push('/');
        
      } catch (err) {
        console.log(err.response.status);
        switch (err.response.status) {
          case 400:
          case 409:
            this.setState({message: err.response.data.message});
            break;
          default:
            this.setState({message: 'server error'});
        } 
      }
    } else {
      this.setState({message});
    }

  }
}



export default withRouter(connect(mapStateToProps, mapDispatchToProps)(LoginDialog))
