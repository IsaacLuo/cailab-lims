import * as React from 'react'
import axios from 'axios'
import { serverURL } from './config'
import getAuthHeader from './authHeader'
import { Table, Checkbox, Button, Notification } from 'element-react'
// import {TableColumn} from 'element-react/typings/index'
interface IUser {
  email: string,
  groups: string[],
  name: string,
}

export interface IUserProps {
}

export interface IUserState {
  users: IUser[],
}

export default class Users extends React.Component<IUserProps, IUserState> {
  constructor(props: IUserProps) {
    super(props);

    this.state = {
      users: [],
    }
    this.getUsers()
  }

  public render() {
    const users = this.state.users.map(user => (
      {
        name: user.name,
        email: user.email,
        isAdmin: user.groups.indexOf('administrators')>=0,
        isUsers: user.groups.indexOf('users')>=0,
      }
    ));

    const tableColums = [
      {
        label: 'name',
        prop: 'name',
      },
      {
        label: 'email',
        prop: 'email',
      },
      {
        label: 'admin',
        prop: 'isAdmin',
        width: 100,
        render: (data :any, col :any, index :number) => {
          return <Checkbox 
            checked={data.isAdmin}
            onChange={this.onChangeAdmin.bind(this,data)} 
          />
        }
      },
      {
        label: 'user',
        prop: 'isUsers',
        width: 100,
        render: (data :any, col :any, index :number) => {
          return <Checkbox 
            checked={data.isUsers}
            onChange={this.onChangeUsers.bind(this,data)} 
          />
        }
      },
    ];
    return (
      <div>
        <Table columns={tableColums} data={users} />
        <Button onClick={this.refresh}>refresh</Button>
      </div>
    );
  }

  private refresh = () => {
    this.getUsers()
  }

  private onChangeAdmin = async (data: any, value:boolean) => {
    console.log(data.email, value)
    try {
      await axios.put(`${serverURL}/api/user/${data.email}/privilege`, {administrators: value}, getAuthHeader())
      await this.getUsers()
    } catch (err) {
      Notification.error({
        title: 'error',
        message: 'unable to change the privilege',
      });
    }
  }

  private onChangeUsers = async (data: any, value:boolean) => {
    console.log(data.email, value)
    try {
      await axios.put(`${serverURL}/api/user/${data.email}/privilege`, {users: value}, getAuthHeader())
      await this.getUsers()
    } catch (err) {
      Notification.error({
        title: 'error',
        message: 'unable to change the privilege',
      });
    }
  }

  private async getUsers () {
    console.log('getting users');
    console.log( getAuthHeader())
    try {
      const res = await axios.get(serverURL+'/api/users', getAuthHeader())
    console.log('users fetched');
    this.setState({
      users: res.data
    })
    } catch (err) {
      console.warn (err)
    }
  }
}
