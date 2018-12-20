import { IStoreState } from 'types';

import * as React from 'react'

// react-router-redux
import { withRouter, Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import {
  ActionLoginDialogVisible,
} from 'actions/appActions'

import {
  ActionClearLoginInformation,
} from 'actions/userActions'

import {Menu} from 'element-react'

export interface INavBarProps {
  loggedIn: boolean,
  username: string,
  groups: string[],
  token: string,
  tokenRefreshTime: Date,

  setDialogVisible: (visible:boolean)=>void,
  clearLoginInformation: ()=>void,
}

const mapStateToProps = (state :IStoreState) => ({
  loggedIn: state.user.loggedIn,
  username: state.user.fullName,
  groups: state.user.groups,
  token: state.user.token,
  tokenRefreshTime: state.user.tokenRefreshTime,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  setDialogVisible: visible => dispatch(ActionLoginDialogVisible(visible)),
  clearLoginInformation: ()=> dispatch(ActionClearLoginInformation()),
})

class NavBar extends React.Component<INavBarProps, any> {
  constructor(props :INavBarProps) {
    super(props);
  }

  // public componentDidMount () {
  // }

  public render() {
    const {loggedIn, username, groups} = this.props;

    return (
      <div>
        <Menu defaultActive="1" className="el-menu-demo" mode="horizontal" onSelect={this.onSelect}>
        <Link to="/">
          <Menu.Item index="1">Home</Menu.Item>
        </Link>
        { groups.indexOf('users') >=0 &&
        <Menu.SubMenu index="2" title="Tables">
          <Link to="/parts/bacteria/"><Menu.Item index="bacteria">Bacteria</Menu.Item></Link>
          <Link to="/parts/primers/"><Menu.Item index="primers">Primers</Menu.Item></Link>
          <Link to="/parts/yeasts/"><Menu.Item index="yeasts">Yeasts</Menu.Item></Link>
        </Menu.SubMenu>
        }
        { groups.indexOf('users') >=0 &&
        <Menu.SubMenu index="3" title="Tasks">
          <Link to="/tasks/assignTubes/"><Menu.Item index="assignTubes">Assign Tubes</Menu.Item></Link>
          <Link to="/tasks/searchTubeBarcode/"><Menu.Item index="searchTubeBarcode">Search Tubes</Menu.Item></Link>
          <Link to="/tasks/searchRackBarcode/"><Menu.Item index="searchRackBarcode">Search Racks</Menu.Item></Link>
        </Menu.SubMenu>
        }
        {loggedIn ?
        <Menu.SubMenu index="user" title={username}>
          <Menu.Item index="logout">log out</Menu.Item>
          <Link to="/myBasket/"><Menu.Item index='pickList'>my baskets</Menu.Item></Link>
          {groups.indexOf('administrators')>=0 && 
          <Link to="/users/"><Menu.Item index="user management">
            user management
          </Menu.Item></Link>}
          {groups.indexOf('administrators')>=0 && 
          <Link to="/requests/partsDeletion"><Menu.Item index="deletion requests">
            deletion requests
          </Menu.Item></Link>
          }
        </Menu.SubMenu> :
        <Menu.Item index="login">log in.</Menu.Item>
        }
        </Menu>
        <div>{this.props.token.substr(this.props.token.length-10, 9)}</div>
        <div>{this.props.tokenRefreshTime.toLocaleTimeString()}</div>
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



export default withRouter(connect(mapStateToProps, mapDispatchToProps)(NavBar))