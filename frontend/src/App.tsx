import * as React from 'react';
import './App.css';

import GoogleLogin from 'react-google-login';
import axios from 'axios';
import logo from './logo.svg';

import {serverURL, googleAuthURL} from './config';

class App extends React.Component {
  public render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.tsx</code> and save to reload.
        </p>
        <GoogleLogin
          clientId={googleAuthURL}
          buttonText="Login"
          onSuccess={this.loginSuccessful}
          onFailure={this.loginFailed}
        />
      </div>
    );
  }

  private loginSuccessful = async (response :any) => {
    console.log(response)
    try {
      const res = await axios.post(
        serverURL + '/api/googleAuth/', 
        {
          token: response.tokenId,
        }
      )
      alert (res.data.message)
    } catch (err) {
      console.error (err)
    }
  }
  private loginFailed = (response :any) => {
    console.warn(response)
  }
}

export default App;
