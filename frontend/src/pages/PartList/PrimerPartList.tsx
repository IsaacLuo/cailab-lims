/**
 * partList
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
import {
  ActionSetNewPartDialogVisible,
  ActionSetEditPartDialogVisible,
} from 'actions/appActions'
import {
  GET_DEFAULT_BASKET,
  GET_PARTS,
  SET_SKIP,
  SET_LIMIT,
  SET_SEARCH_KEYWORD,
  SET_USER_FILTER,
  SET_SORT_METHOD,
  EXPORT_TO_XLSX,
  } from './actions';

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
import {PartList} from 'pages/PartList';


const MyClickableIcon = styled(Button)`
  &+&{
    margin-left: 0px;
  }
`;

const FullWidthTable = styled(Table)`
  width: 100%;
`

interface IExpandedPanel {
  type: string,
  expandPannel?: (data:any) => JSX.Element,
}

interface IPartsCount {
  bacteria: number,
  primers: number,
  yeasts: number,
}

interface IProps extends IReactRouterProps {
  allUsers: IUserInfo[],
  partsCount: IPartsCount,
  newPartDialogVisible: boolean,
  loggedIn: boolean,
  userId: string,
  editPartDialogVisible: boolean,
  basketCount: number,
  defaultBasket: IBasket,
  searchKeyword: string,
  userFilter: string,
  skip: number,
  limit: number,
  total: number,
  sortMethod: {
    order: 'asc'|'desc',
    prop: string,
  },
  parts: IPart[],
  loading: boolean,
  getUserList: () => void,
  setNewPartDialogVisible: (visible: boolean) => void,
  setEditPartDialogVisible: (visible: boolean, partId: string) => void,
  addPartToBasket: (ids: string[]) => void,
  getBasket: () => void,
  getParts: (data) => void,

  setSearchKeyword: (val:string) => void,
  setUserFilter: (val:string) => void,
  setSkip: (val:number) => void,
  setLimit: (val:number) => void,
  setSort: (sortMethod: any) => void,
  exportToXlsx: (skip?: number, limit?:number) => void,
}

interface IState {
  columns: Array<IColumn|IExpandedPanel>,
  selectedIds: string[],
}

const mapStateToProps = (state :IStoreState) => ({
  partsCount: state.partsCount,
  allUsers: state.app.allUsers,
  newPartDialogVisible: state.app.newPartDialogVisible,
  loggedIn: state.user.loggedIn,
  userId: state.user.userId,
  editPartDialogVisible: state.app.editPartDialogVisible,

  defaultBasket: state.partList.currentBasket,
  searchKeyword: state.partList.searchKeyword,
  userFilter: state.partList.userFilter,
  skip: state.partList.skip,
  limit: state.partList.limit,
  total: state.partList.total,
  sortMethod: state.partList.sortMethod,
  parts: state.partList.parts,

  loading: state.partList.loading,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  getUserList: ()=>dispatch({type:'GET_USER_LIST'}),
  setNewPartDialogVisible: visible => dispatch(ActionSetNewPartDialogVisible(visible)),
  setEditPartDialogVisible: (visible, partId) => dispatch(ActionSetEditPartDialogVisible(visible, partId)),
  getParts: (data) => dispatch({type:GET_PARTS, data}),
  getBasket: () => dispatch({type:GET_DEFAULT_BASKET}),
  addPartToBasket: data => dispatch ({type:'ADD_PARTS_TO_BASKET', data}),

  setSearchKeyword: (val:string) => dispatch({type:SET_SEARCH_KEYWORD, data: val}),
  setUserFilter: (val:string) => dispatch({type:SET_USER_FILTER, data: val}),
  setSkip: (val:number) => dispatch({type:SET_SKIP, data: val}),
  setLimit: (val:number) => dispatch({type:SET_LIMIT, data: val}),
  setSort: (sortMethod: any) => dispatch({type:SET_SORT_METHOD, data:sortMethod }),
  exportToXlsx: (skip?: number, limit?: number) => dispatch({type:EXPORT_TO_XLSX, data:{skip, limit}}),
})

class PrimerPartList extends PartList {
  constructor(props) {
    super(props);
  }

  protected getTitle () {
    return 'primers'
  }

  protected getSampleType () {
    return 'primer'
  }
}



export default withRouter(connect(mapStateToProps, mapDispatchToProps)(PrimerPartList))
