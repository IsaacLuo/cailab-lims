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
  DELETE_PART,
  DELETE_PART_REQUEST,
  ADD_PARTS_TO_BASKET,
  } from './actions';

import {
  GET_BASKET_LIST,
} from '../BasketList/actions';

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
import { format } from 'path';
import PartsSearchBar from 'components/PartsSearchBar';


const MyClickableIcon = styled(Button)`
  &+&{
    margin-left: 0px;
  }
`;

const FullWidthTable = styled(Table)`
  width: 100%;
`

const FlexPanel = styled.div`
  display:flex;
  flex-direction:column;
  align-items: center;
`

const FlexRow = styled.div`
  display:flex;
  align-items: center;
  margin-top:5px;
  margin-bottom:5px;
  justify-content: space-between;
  & > div {
    margin-left: 10px;
  }
  & > button {
    margin-left: 10px;
  }
`

const Title = styled.span`
  margin-right:5px;
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

export interface IProps extends IReactRouterProps {
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

  // the basket list should shown in the dropdown select
  basketList: IBasket[],
  // the default basket id
  defaultBasketId: string,

  getUserList: () => void,
  setNewPartDialogVisible: (visible: boolean) => void,
  setEditPartDialogVisible: (visible: boolean, partId: string) => void,
  addPartToBasket: (partIds: string[], basketId:string) => void,
  getBasket: () => void,
  getParts: (data) => void,

  setSearchKeyword: (val:string) => void,
  setUserFilter: (val:string) => void,
  setSkip: (val:number) => void,
  setLimit: (val:number) => void,
  setSort: (sortMethod: any) => void,
  exportToXlsx: (skip?: number, limit?:number) => void,
  dispatchDeletePart: (id: string) => void,
  dispatchDeletePartRequest: (id: string) => void,
  dispatchGetBasketList: () => void,
}

export interface IState {
  columns: Array<IColumn|IExpandedPanel>,
  selectedIds: string[],
  currentBasketId: string,
}

export const mapStateToProps = (state :IStoreState) => ({
  partsCount: state.partsCount,
  allUsers: state.app.allUsers,
  newPartDialogVisible: state.app.newPartDialogVisible,
  loggedIn: state.user.loggedIn,
  userId: state.user.userId,
  editPartDialogVisible: state.app.editPartDialogVisible,

  basketList: state.basket.basketList,
  defaultBasketId: state.basket.defaultBasketId,

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

export const mapDispatchToProps = (dispatch :Dispatch) => ({
  getUserList: ()=>dispatch({type:'GET_USER_LIST'}),
  setNewPartDialogVisible: visible => dispatch(ActionSetNewPartDialogVisible(visible)),
  setEditPartDialogVisible: (visible, partId) => dispatch(ActionSetEditPartDialogVisible(visible, partId)),
  getParts: (data) => dispatch({type:GET_PARTS, data}),
  getBasket: () => dispatch({type:GET_DEFAULT_BASKET}),
  addPartToBasket: (partIds: string[], basketId:string) => dispatch ({type: ADD_PARTS_TO_BASKET, data:{partIds, basketId}}),
  dispatchDeletePart: data => dispatch({type:DELETE_PART, data}),
  dispatchDeletePartRequest: data => dispatch({type:DELETE_PART_REQUEST, data}),
  dispatchGetBasketList: () => dispatch({type: GET_BASKET_LIST}),

  setSearchKeyword: (val:string) => dispatch({type:SET_SEARCH_KEYWORD, data: val}),
  setUserFilter: (val:string) => dispatch({type:SET_USER_FILTER, data: val}),
  setSkip: (val:number) => dispatch({type:SET_SKIP, data: val}),
  setLimit: (val:number) => dispatch({type:SET_LIMIT, data: val}),
  setSort: (sortMethod: any) => dispatch({type:SET_SORT_METHOD, data:sortMethod }),
  exportToXlsx: (skip?: number, limit?: number) => dispatch({type:EXPORT_TO_XLSX, data:{skip, limit}}),
})

export class PartList extends React.Component<IProps, IState> {

  constructor(props) {
    super(props);
    this.state = {
      columns: this.generateColumnTitle(),
      selectedIds: [],
      currentBasketId: props.defaultBasketId,
    };
    this.props.getUserList();
  }

  public componentDidMount() {
    if (this.props.loggedIn) {
      console.debug('componentDidMount');
      this.props.getBasket();
      const qsValues = qs.parse(this.props.location.search, { ignoreQueryPrefix: true });
      let {searchKeyword, userFilter, page, limit} = qsValues;
      const {sort, order} = qsValues;

      const sampleType = this.getSampleType();

      page = parseInt(page, 10);
      if (isNaN(page)) {
        page = 0;
      }

      limit = parseInt(limit, 10);
      if (isNaN(limit)) {
        limit = 10;
      }

      const skip = page * limit;

      if (!searchKeyword) {
        searchKeyword = ''
      }

      if (!userFilter) {
        userFilter = ''
      }

      let sortMethod = this.props.sortMethod;

      if (sort) {
        sortMethod = {prop: sort, order: order==='asc' ? 'asc': 'desc'};
      }
      
      this.props.getParts({sampleType, searchKeyword, userFilter, skip, limit, sortMethod});
      this.props.dispatchGetBasketList();
    }
  }

  public componentWillReceiveProps(nextProps:IProps) {
    if (!nextProps.editPartDialogVisible && this.props.editPartDialogVisible) {
      // editPartDialog has closed, fetch data again from server;
      // this.props.getParts({keyword, userFilter, skip, limit});
      const {searchKeyword, userFilter, skip, limit, sortMethod} = this.props;
      this.props.getParts({searchKeyword, userFilter, skip, limit, sortMethod});
    }
    if (nextProps.limit !== this.props.limit ||
      nextProps.skip !== this.props.skip ||
      nextProps.userFilter !== this.props.userFilter ||
      nextProps.searchKeyword !== this.props.searchKeyword
    ) {
      // set new URL
      this.pushHistory(nextProps);
    }
    if (nextProps.defaultBasketId !== this.props.defaultBasketId) {
      this.setState({currentBasketId: nextProps.defaultBasketId})
    } else {
      // update "selected" label in select by setting the value to empty and back, there might be a better way but I don't know.
      const currentBasketId = this.state.currentBasketId;
      this.setState({currentBasketId: ''}, ()=>{ this.setState({currentBasketId})});
    }
    
  }
  
  public render() {
    const {loggedIn, allUsers, editPartDialogVisible, defaultBasket} = this.props;
    // return <div>{JSON.stringify(this.props)}</div>
    
    const basketCount = defaultBasket ? defaultBasket.partsCount : undefined;
    
    // const {skip, limit, total, loading, userFilter} = this.state;
    const {basketList, skip, limit, total, userFilter, loading} = this.props;

    document.title = `Cailab Lims - Part List`;

    if (!loggedIn) {
      console.log('not logged in, why?', this.props, this.state);
      return <Redirect to="/" />
    }

    const uploadURL = this.getUploadURL();

    const basketListDropDownItems = basketList.map(v=>
      <Select.Option key={v._id} label={`${v.name} (${v.partsCount})`} value={v._id} />
    );

    return (
      <ErrorBoundary>
        {editPartDialogVisible && <EditPartDialog/>}
        <FlexPanel>
          <h1>{this.getTitle()}</h1>
          <div style={{marginLeft:100,marginRight:100, minWidth:'50%'}}>
            <FlexRow>
              <Title>Search</Title>
              <PartsSearchBar onSearch={this.props.setSearchKeyword}/>
            </FlexRow>
          </div>
          <FlexRow>
            <Title>user filter </Title>

            <Select
              value = {userFilter}
              clearable = {true}
              onChange = {this.onFilterUserChange}
            >
              {
                allUsers.map(user => <Select.Option key={user.id} label={user.name} value={user.id} />)
              }
            </Select>

            {uploadURL && <Link to={uploadURL} style={{marginLeft:10,marginRight:10}}>
                <Button type="primary">import</Button>
              </Link>
            }

            <Button onClick = {this.exportToXlsxCurrentPage}>export page</Button>
            <Button onClick = {this.exportToXlsxAllPages}>export all</Button>
            <Select value={this.state.currentBasketId} placeholder="choose basket">
              { basketListDropDownItems }
            </Select>
            <Button icon="plus" onClick = {this.addPartsToBasket} >add to basket</Button>
          </FlexRow>
    
          <Pagination
            layout="total, sizes, prev, pager, next, jumper"
            total={total}
            pageSize={limit}
            currentPage={Math.floor(skip/limit)+1}
            onSizeChange={this.onLimitChange}
            onCurrentChange={this.onPageChange}
          />
          <div style={{width:'100%'}}>
          <Loading loading={loading} text={'loading'}>
            <Table
              style={{width: '100%'}}
              columns={this.state.columns}
              data={this.props.parts}
              stripe={true}
              onSortChange={this.onTableSortChange}
              onSelectChange={this.onSelectChange}
            />
          </Loading>
          </div>
        <Pagination
          layout="total, sizes, prev, pager, next, jumper"
          total={total}
          pageSize={limit}
          currentPage={Math.floor(skip/limit)+1}
          onSizeChange={this.onLimitChange}
          onCurrentChange={this.onPageChange}
        />
        </FlexPanel>
      </ErrorBoundary>
            
    )
  }

  public pushHistory (props: IProps) {
    const {searchKeyword, userFilter, skip, limit, sortMethod} = props;
    let pathName = props.history.location.pathname;
    pathName += '?';
    const page = Math.floor(skip / limit);
    const query = {
      searchKeyword: searchKeyword === '' ? undefined : searchKeyword ,
      userFilter: userFilter === '' ? undefined : userFilter,
      page: page === 0 ? undefined : page,
      limit: limit === 10 ? undefined : limit,
      sort: sortMethod.prop === '_id' ? undefined : sortMethod.prop,
      desc: sortMethod.order=== 'asc' ? 'asc' : undefined,
    }
    console.log(qs.stringify(query));
    props.history.replace(`${pathName}${qs.stringify(query)}`);
    
  }

  protected getSampleType (): string|undefined {
    return undefined;
  }

  protected getUploadURL(): string|undefined {
    return undefined;
  }

  protected format(obj: any): string {
    const re = '';
    if (Array.isArray(obj)) {
      return obj.map(v=>v.toString()).join('; ')
    } else if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(obj.toString())) {
      return (new Date(obj)).toLocaleDateString()
    } else {
      return obj.toString();
    }
  }

  protected onPageChange = (currentPage: number) => {
    this.props.setSkip((currentPage-1) * this.props.limit);
  }

  protected onLimitChange = (limit: number) => {
    this.props.setLimit(limit); 
  }

  protected onTableSortChange = (sortProp: {column:any, order:'ascending'|'descending', prop:string}) => {
    const {order, prop} = sortProp;
    // this.setState({sortMethod: {order, prop}}, this.fetchPartsData);
  }
  protected onSelectChange = (selection:any[]) => {
    console.log(selection);
    this.setState({selectedIds: selection.map(v => v._id)})
  }

  protected exportToXlsxCurrentPage = async () => {
    console.log('exportToXlsxCurrentPage');
    const {skip, limit } = this.props;
    this.props.exportToXlsx(skip, limit);
  }
  protected exportToXlsxAllPages = async () => {
    console.log('exportToXlsxAllPages')
    this.props.exportToXlsx(undefined, undefined);
  }

  protected addPartsToBasket = async () => {
    this.props.addPartToBasket(this.state.selectedIds, this.state.currentBasketId);
  }

    protected generateExpandTablePanel() {
    return {
        type: 'expand',
        expandPannel: data => {
          const attachmentRows = data && data.attachments && data.attachments.map(att => 
            <div key={att.fileId}>
              <a
                onClick={this.onClickAttachment.bind(this,att.fileId, att.fileName)}
              >
                {att.fileName},
                {fileSizeHumanReadable(att.fileSize)}
              </a>
            </div>);

          let otherData:any[] = [], customData:any[] = [];
          if (data.content) {
            otherData = Object.keys(data.content).filter(key => ['customData'].indexOf(key) < 0).map(key => ({key, value: this.format(data.content[key])}));
            if (data.content.customData) {
              customData = Object.keys(data.content.customData).map(key => ({key, value: this.format(data.content.customData[key])}));
            }
          }
          return <div className="partDetailPanel"style={{width:'100%'}}>
            <FullWidthTable
              rowStyle={this.rowStyle}
              showHeader={false}
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
              data={[
                {key: 'comment', value: data.comment},
                {key: 'creator', value: data.ownerName},
                {key: 'created at', value: new Date(data.createdAt).toLocaleDateString()},
                {key: 'updated at', value: new Date(data.createdAt).toLocaleDateString()},
                // other data
                ...otherData,
                // custom data
                ...customData,
              ]}
            />
            {data.containers && data.containers.length > 0 && <div>
              <div><b> containers </b></div>
              {data.containers.map((v,i)=><div key={i}>{v.barcode} {v.currentStatus}</div>)}
            </div>}
            {data.attachments && data.attachments.length > 0 &&
              (<div style={{marginTop:10, marginBottom: 5}}> 
                <div><b>attachments</b></div> 
                {attachmentRows}
              </div>
            )}
            {/* {JSON.stringify(data)} */}
            </div>
        },
      }
  }

  protected generateColumnTitle () :Array<IColumn|IExpandedPanel>{
    const {userId} = this.props;
    return [
      {
        type: 'selection',
      },
      this.generateExpandTablePanel(),
      {
        label: "lab name",
        prop: "labName",
        sortable: "custom",
        width:100,
        render: (data) => <div>
          <Link to={`/part/${data._id}`}>{data.labName}</Link>
        </div>,
      },
      {
        label: "personal name",
        prop: "personalName",
        sortable: "custom",
        width:150,
        render: (data) => <div>
          <Link to={`/part/${data._id}`}>{data.personalName}</Link>
        </div>,
      },
      {
        label: "other names",
        prop: "tags",
        sortable: "custom",
        width:100,
        render: (data, column, index) =>
          <div style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>{this.format(data.tags)}</div> 
      },
      {
        label: "comment",
        prop: "comment",
        sortable: "custom",
        minWidth: 200,
        render: (data, column, index) =>
          <div style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>{data.description} {data.comment}</div> 
      },
      {
        label: "date",
        prop: "date",
        sortable: "custom",
        width: 180,
        render: (data) => (new Date(data.createdAt).toLocaleDateString())
      },
      {
        label: "...",
        prop: "attachment",
        width: 100,
        render: (row, column, index) =>
        <div>
          {row.attachments&& row.attachments[0] &&
            (<a
              onClick={this.onClickAttachment.bind(this,row.attachments[0].fileId, row.attachments[0].fileName)}
            >
              <MyClickableIcon type="text" icon="document"/>
            </a>)
          }
          {row.ownerId === userId && <MyClickableIcon type="text" icon="edit" onClick={this.onClickEditPart.bind(this, row)} />}
          {row.ownerId === userId && <MyClickableIcon type="text" icon="delete2" onClick={this.onClickDeletePart.bind(this, row)} />}
        </div>
      }
      ];
  }

  protected getTitle() {
    return 'Parts';
  }

  protected onFilterUserChange = (value: string) => {
    this.props.setUserFilter(value);
  }

  //   this.setState({data, loading:false});
  // }

  // // delete a part directly
  // // @id: the part id
  // private async deletePart(id:string) {
  //   try {
  //     const res = await axios({
  //       url: serverURL+`/api/part/${id}`,
  //       method: 'DELETE',
  //       ...getAuthHeader(),
  //     });
  //     this.fetchPartsData();
  //     Message.success('deleted');
  //   } catch (err) {
  //     if (err.response) {
  //       Message.error(`ERROR ${err.response.status} ${err.response.data.message}`);
  //     } else {
  //       Message.error('unable to delete');
  //     }
  //   }
  // }

  // // send a request to delete a part
  // // @id: the part id
  // private async requestToDeletePart(id:string) {
  //   try {
  //     const res = await axios({
  //       url: serverURL+`/api/sudoRequests/partDeletion/${id}`,
  //       method: 'PUT',
  //       ...getAuthHeader(),
  //     });
  //     this.fetchPartsData();
  //     Message.success('request posted');
  //   } catch (err) {
  //     if (err.response) {
  //       Message.error(`ERROR ${err.response.status} ${err.response.data.message}`);
  //     } else {
  //       Message.error('unable to post request');
  //     }
  //   }
  // }

  // when clicking on the attachment link, download the attachment
  protected onClickAttachment = async (fileId: string, fileName: string, e:React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    const res = await axios({
      url: serverURL+`/api/attachment/${fileId}`,
      method: 'GET',
      responseType: 'blob', // important
      ...getAuthHeader(),
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
  }

  protected onClickEditPart = async (data:any) => {
    this.props.setEditPartDialogVisible(true, data._id);
  }

  protected onClickDeletePart = async (data:any) => {
    const id = data._id;
    console.debug(data);
    const createdAt = new Date(data.createdAt);
    const cancelMessage = () => Message({type: 'info', message: 'canceled'})
    console.log(createdAt.getTime() );
    const timeSpan = Date.now() - createdAt.getTime();
    if ( timeSpan < 7*24*3600000) {
      MessageBox.confirm('delete this part? this operation CANNOT be undone', 'warning', {
        type: 'warning'
      }).then(() => {
        // confirm deleting part
        this.props.dispatchDeletePart(id);
        
      }).catch(cancelMessage);
    } else {
      MessageBox.confirm(`Cannot directly delete a part (created ${Math.floor(timeSpan/24/3600000)} days ago) older than 1 week, send a request to administrator?`, 'warning', {
        type: 'warning'
      }).then(() => {
        // confirm deleting part
        this.props.dispatchDeletePartRequest(id);
      }).catch(cancelMessage);
    }
  }

  protected rowStyle = ()=>({border:0, textAlign:'left'})

}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(PartList))
