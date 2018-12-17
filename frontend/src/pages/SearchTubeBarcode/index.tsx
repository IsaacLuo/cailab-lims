/**
 * SearchTubeBarcode
 */

// types
import {
  IStoreState,
  IBasket,
  IReactRouterProps,
  IUserInfo,
  IColumn,
  IPartListRowData,
  IPart,
} from 'types'

// react
import * as React from 'react'
import axios from 'axios'
import qs from 'qs'

// redux
import { Dispatch } from 'redux'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'

// react-router
import {Redirect} from 'react-router'
import {Link} from 'react-router-dom'

// helpers
import { serverURL } from 'config'
import getAuthHeader from 'authHeader'
import {fileSizeHumanReadable, toPlural} from 'tools'

// components
import {
  Pagination,
  Loading,
  Select,
  Button,
  MessageBox,
  Message,
  Table,
  Input,
} from 'element-react'
import styled from 'styled-components'
import ErrorBoundary from 'components/ErrorBoundary'
import EditPartDialog from 'components/EditPartDialog';
import { GET_BASKET_LIST, GET_BASKET } from 'pages/BasketList/actions';
import ClickableIcon from 'components/ClickableIcon';
import { GET_PART } from './actions';
import CentralPanel from 'components/CentralPanel';

const MessagePanel = styled.div`
  min-height: 2em;
`

interface IProps extends IReactRouterProps {
  part?:IPart,
  message: string,
  searchPart: (id:string) => void,
}

interface IState {
  barcode: string,
}

const mapStateToProps = (state :IStoreState) => ({
  message: state.searchTubeBarcode.message,
  part: state.searchTubeBarcode.part,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  searchPart: (barcode:string) => dispatch({type:GET_PART, data:{barcode,}}),
})

class SearchTubeBarcode extends React.Component<IProps, IState> {
  constructor(props) {
    super(props);
    this.state = {
      barcode: '',
    }
  }

  public render() {
    const {part} = this.props;
    let table:Array<{key:string, value:string}>;
    if (part) {
      table = 
      ['_id', 'labName', 'psersonalName', 'ownerName', 'sampleType', 'comment', 'createdAt', 'updatedAt', 'date', 'tags'].map(
        v => ({key: v, value:part[v] ? (Array.isArray(part[v]) ? part[v].join('; '): part[v]) : undefined})
      )
      if (part.content) {
        for (const key in part.content) {
          if (part.content[key]) {
            table.push({key, value: Array.isArray(part.content[key]) ? part.content[key].join('; ') : part.content[key]});
          }
        }
      }
    } else {
      table = [];
    }
    
    return <CentralPanel>
      <div style={{width:'80%'}}>
        <h1>Search Tube Barcode</h1>
        <Input
          value = {this.state.barcode}
          onChange = {this.onChangeBarcode}
          onKeyUp = {this.onInputKeyUp}
        />
        <MessagePanel>{this.props.message}</MessagePanel>
        {table.length>0 && <Table
          data={table}
          columns={[
              {
                label: "key",
                prop: "key",
                align: "right",
                width: 200,
              },
              {
                label: "value",
                prop: "value",
              },
            ]}
        />}
      </div>
    </CentralPanel>
  }

  private onChangeBarcode = (barcode) => {
    this.setState({barcode});
  }

  private onInputKeyUp = (event) => {
    if (event.keyCode === 13) {
      const {barcode} = this.state;
      console.log(barcode);
      this.props.searchPart(barcode);
      event.target.select();
    }
  }
}



export default withRouter(connect(mapStateToProps, mapDispatchToProps)(SearchTubeBarcode))
