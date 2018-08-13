import * as React from 'react'



// react-router-redux
import { IStoreState } from './store';
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import {ActionLoginDialogVisible} from './actions'

import {Menu} from 'element-react'



export interface INavBarProps {
  loggedIn: boolean,
  username: string,

  setDialogVisible: (visible:boolean)=>void,
}

class NavBar extends React.Component<INavBarProps, any> {
  public render() {
    const {loggedIn, username} = this.props;

    return (
      <div>
        <Menu defaultActive="1" className="el-menu-demo" mode="horizontal" onSelect={this.onSelect}>
        <Menu.Item index="1">home</Menu.Item>
        <Menu.SubMenu index="2" title="tables">
          <Menu.Item index="2-1">backteria</Menu.Item>
          <Menu.Item index="2-2">primers</Menu.Item>
          <Menu.Item index="2-3">yeasts</Menu.Item>
        </Menu.SubMenu>
        <Menu.Item index="login">{loggedIn ? username : 'log in'}</Menu.Item>
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
    }
  }
}


const mapStateToProps = (state :IStoreState) => ({
  loggedIn: state.loggedIn,
  username: state.username,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  setDialogVisible: visible => dispatch(ActionLoginDialogVisible(visible)),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(NavBar))