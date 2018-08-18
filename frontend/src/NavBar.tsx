import * as React from 'react'



// react-router-redux
import { IStoreState } from './store';
import { withRouter, Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import {
  ActionLoginDialogVisible,
  ActionClearLoginInformation,
} from './actions'

import {Menu} from 'element-react'



export interface INavBarProps {
  loggedIn: boolean,
  username: string,
  groups: string[],

  setDialogVisible: (visible:boolean)=>void,
  clearLoginInformation: ()=>void,
}

class NavBar extends React.Component<INavBarProps, any> {
  public render() {
    const {loggedIn, username, groups} = this.props;

    return (
      <div>
        <Menu defaultActive="1" className="el-menu-demo" mode="horizontal" onSelect={this.onSelect}>
        <Link to="/">
          <Menu.Item index="1">home</Menu.Item>
        </Link>
        <Menu.SubMenu index="2" title="tables">
          <Menu.Item index="2-1">backteria</Menu.Item>
          <Menu.Item index="2-2">primers</Menu.Item>
          <Menu.Item index="2-3">yeasts</Menu.Item>
        </Menu.SubMenu>
        {loggedIn ?
        <Menu.SubMenu index="user" title={username}>
          <Menu.Item index="logout">log out</Menu.Item>
          {groups.indexOf('administrators')>=0 && 
          <Link to="/users"><Menu.Item index="user management">
            user management
          </Menu.Item></Link>}
        </Menu.SubMenu> :
        <Menu.Item index="login">log in</Menu.Item>
        }
        </Menu>
      </div>
    );
  }

  private onSelect = (index:string) => {
    switch(index) {
      case 'login':
        console.log('login');
        this.props.setDialogVisible(true);
      break;

      case 'logout':
        this.props.clearLoginInformation();
      break;
    }
  }
}

const mapStateToProps = (state :IStoreState) => ({
  loggedIn: state.loggedIn,
  username: state.fullName,
  groups: state.groups,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  setDialogVisible: visible => dispatch(ActionLoginDialogVisible(visible)),
  clearLoginInformation: ()=> dispatch(ActionClearLoginInformation()),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(NavBar))