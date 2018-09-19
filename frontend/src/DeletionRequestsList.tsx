import * as React from 'react'
import axios from 'axios'

// components
import { Pagination, Icon, Loading, Select, Button, MessageBox, Message } from 'element-react'
import ErrorBoundary from './ErrorBoundary'
import {Table} from 'element-react'
import styled from 'styled-components'

// redux
import { IStoreState } from './store'
import { Dispatch } from 'redux'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'

// helpers
import { serverURL } from './config'
import getAuthHeader from './authHeader'
import {fileSizeHumanReadable, toPlural} from './tools'
import {IUserInfo, IColumn, IPartListRowData} from './types'

interface IProps {
  loggedIn: boolean,
  userId: string,
}

interface IState {
  data: any[],
  loading: boolean,
}

const RequestContainer = styled.div`
display: flex;
justify-content: center;
`;

const RequestPanel = styled.div`
width: 400px;
height: 400px;
border: 2px solid black;
overflow-style: auto;
border-radius: 25px;
margin: 20px;
flex-wrap: wrap;
display: flex;
flex-direction: column;
justify-content: space-between;
padding-top: 25px;
padding-bottom: 25px;

`;

const RowTag = styled.span`
color: #999;
`;

const DeleteButton = styled.div`
justify-content: flex-end;
`;

class DeletionRequestsList extends React.Component<IProps, IState> {

  constructor(props) {
    super(props);
    this.state = {
      data: [],
      loading: false,
    }
    this.getRequests();
  }
  
  public render() {
    const {data} = this.state;
    return (
      <ErrorBoundary>
        <RequestContainer>
          {data.length > 0 ? data.map(request => <RequestPanel key={request.request._id}>
            <div>
              <div><RowTag>sender name: </RowTag>{request.request.senderName}</div>
              <div><RowTag>lab name: </RowTag>{request.part.labName}</div>
              <div><RowTag>personal name: </RowTag>{request.part.personalName}</div>
              <div><RowTag>tags: </RowTag>{request.part.tags}</div>
              <div><RowTag>comment: </RowTag>{request.part.comment}</div>
              <div><RowTag>date: </RowTag>{new Date(request.part.date).toLocaleDateString()}</div>
              <div><RowTag>created date:</RowTag>{new Date(request.part.createdAt).toLocaleDateString()}</div>
              <div>{request.request.partId}</div>
              <div>{request.part._id}</div>
            </div>
            <DeleteButton>
              <Button type='danger' icon='delete' onClick={this.deletePart.bind(this, request.request.partId)}>delete</Button>
            </DeleteButton>
          </RequestPanel>):<div>no data</div>}
        </RequestContainer>
      </ErrorBoundary>
    )
  }

  private async deletePart (id: string) {
    try {
      const res = await axios.delete(`${serverURL}/api/part/${id}`, getAuthHeader());
      console.log(res);
    } catch (err) {
      if (err.response) {
        Message.error(`ERROR ${err.response.status} ${err.response.data.message}`);
      } else {
        Message.error('unable to delete');
      }
    }
    this.getRequests();
  }

  private async getRequests () {
    try {
      const res = await axios.get(`${serverURL}/api/sudoRequests/partDeletions`, getAuthHeader());
      this.setState({data:res.data});
    } catch (err) {
      if (err.response) {
        Message.error(`ERROR ${err.response.status} ${err.response.data.message}`);
      } else {
        Message.error('unable to delete');
      }
    }
  }
}

const mapStateToProps = (state :IStoreState) => ({
  loggedIn: state.loggedIn,
  userId: state.userId,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(DeletionRequestsList))
