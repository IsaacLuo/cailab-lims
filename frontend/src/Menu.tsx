import * as React from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import {Menu} from 'element-react'

export interface INavBarProps {
}

class NavBar extends React.Component<INavBarProps, any> {
  public render() {
    return (
      <div>
        <Menu defaultActive="1" className="el-menu-demo" mode="horizontal">
        <Menu.Item index="1">home</Menu.Item>
        <Menu.SubMenu index="2" title="tables">
          <Menu.Item index="2-1">backteria</Menu.Item>
          <Menu.Item index="2-2">primers</Menu.Item>
          <Menu.Item index="2-3">yeasts</Menu.Item>
        </Menu.SubMenu>
        <Menu.Item index="3">user</Menu.Item>
        </Menu>
      </div>
    );
  }
}


const mapStateToProps = (state) => ({
  
})

const mapDispatchToProps = {
  
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(NavBar))