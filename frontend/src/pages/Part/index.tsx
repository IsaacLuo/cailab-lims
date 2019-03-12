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
  ITube,
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
import { GET_BASKET_LIST, GET_BASKET } from 'pages/BasketList/actions';
import ClickableIcon from 'components/ClickableIcon';
import { GET_PART } from './actions';
import CentralPanel from 'components/CentralPanel';
import PartTable from 'components/PartTable';
import ContainerTable from 'components/ContainerTable';
import { getParts } from 'saga';
import PartAttachments from 'components/PartAttachments';

const MainPanel = styled.div`
  width:90%;
  margin-left:auto;
  margin-right:auto;
`

const MessagePanel = styled.div`
  min-height: 2em;
`

interface IProps extends IReactRouterProps {
  part?:IPart,
  getPart: (id:string)=>void,
}

interface IState {
}

const mapStateToProps = (state :IStoreState) => ({
  part: state.part.part,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  getPart: (id:string) => dispatch({type:GET_PART, data:{id,}}),
})

class Part extends React.Component<IProps, IState> {
  constructor(props) {
    super(props);
    if(this.props.match.params && this.props.match.params.id) {
      this.props.getPart(this.props.match.params.id);
    }
  }

  public render() {
    const {part} = this.props;
    return <MainPanel>
      {part ?
      <div>
        <h1>{part.labName} : {part.personalName}</h1>
        <h2>basic information</h2>
        <PartTable part={part}/>
        <h3>containers</h3>
        <ContainerTable containers={part.containers} />
        <h3>attachments</h3>
        <PartAttachments part={part}/>
      </div>
      :
      <h1>invalid part</h1>
      }
    </MainPanel>
  }
}



export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Part))
