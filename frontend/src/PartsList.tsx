import * as React from 'react'
import axios from 'axios'
import qs from 'qs'

// components
import { Pagination, Icon, Loading, Select, Button, Notification, MessageBox, Message } from 'element-react'
import NewPartDialog from './NewPartDialog'
import ErrorBoundary from './ErrorBoundary'

import {Table} from 'element-react'


// redux
import { IStoreState } from './store'
import { Dispatch } from 'redux'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'

import {
  ActionSetNewPartDialogVisible,
} from './actions'

// react-router
import {Redirect} from 'react-router'
import {Link} from 'react-router-dom'
import {IReactRouterProps} from './types'

// helpers
import { serverURL } from './config'
import getAuthHeader from './authHeader'
import {fileSizeHumanReadable, toPlural} from './tools'
import {IUserInfo, IColumn} from './types'


interface IExpandedPanel {
  type: string,
  expandPannel: (data:any) => JSX.Element,
}

interface IPartsCount {
  bacteria: number,
  primers: number,
  yeasts: number,
}

interface IProps extends IReactRouterProps {
  sampleType: string,
  partsCount: IPartsCount,
  allUsers: IUserInfo[],
  newPartDialogVisible: boolean,
  loggedIn: boolean,
  userId: string,
  getUserList: () => void,
  setNewPartDialogVisible: (visible: boolean) => void,
}

interface IState {
  columns: Array<IColumn|IExpandedPanel>,
  data: any[],
  skip: number,
  limit: number,
  total: number,
  loading: boolean,

  userFilter: string,
  sortMethod: {order?:'ascending'|'descending', prop?:string},
}

class PartsList extends React.Component<IProps, IState> {

  private detailTableStyle = {width:'100%'}

  constructor(props) {
    super(props);

    const {userFilter, skip, limit} = qs.parse(this.props.location.search, { ignoreQueryPrefix: true });

    this.state = {
      columns: this.generateCoulumnTitle(),
      data: [],
      skip: skip ? parseInt(skip,10) : 0,
      limit: limit ? parseInt(limit,10): 10,
      total: 0,
      loading: true,
      userFilter: userFilter ? userFilter : '',
      sortMethod: {order:undefined, prop:undefined},
    };
    if (props.loggedIn) {
      this.fetchPartsData();
      props.getUserList();
    }
  }
  
  public render() {
    const {loggedIn, allUsers, newPartDialogVisible} = this.props;
    const {skip, limit, total, loading, userFilter} = this.state;
    if (!loggedIn) {
      console.log('not logged in, why?', this.props, this.state);
      return <Redirect to="/" />
    }
    return (
      <ErrorBoundary>
      <div style={{width:'100%'}}>
        <h1>{toPlural(this.props.sampleType)}</h1>
        <div>
          <span>user filter </span>
          <Select
            value = {userFilter}
            clearable = {true}
            onChange = {this.onFilterUserChange}
          >
            {
              allUsers.map(user => <Select.Option key={user.id} label={user.name} value={user.id} />)
            }
          </Select>
          {/* <Button onClick = {this.props.setNewPartDialogVisible.bind(this, true)}>new part</Button> */}
          <Link to={`/parts/${toPlural(this.props.sampleType)}/upload`} style={{marginLeft:10,marginRight:10}}>
            <Button type="primary">import</Button>
          </Link>
          <Button onClick = {this.exportToXlsxCurrentPage}>export page</Button>
          <Button onClick = {this.exportToXlsxAllPages}>export all</Button>
        </div>
        <Pagination
          layout="total, sizes, prev, pager, next, jumper"
          total={total}
          pageSize={limit}
          currentPage={Math.floor(skip/limit)+1}
          onSizeChange={this.onLimitChange}
          onCurrentChange={this.onPageChange}
        />
        <Loading loading={loading} text={'loading'}>
          <Table
            style={{width: '100%'}}
            columns={this.state.columns}
            data={this.state.data}
            stripe={true}
            onSortChange={this.onTableSortChange}
          />
        </Loading>
        <Pagination
          layout="total, sizes, prev, pager, next, jumper"
          total={total}
          pageSize={limit}
          currentPage={Math.floor(skip/limit)+1}
          onSizeChange={this.onLimitChange}
          onCurrentChange={this.onPageChange}
        />
      </div>
      </ErrorBoundary>
    )
  }

  private onPageChange = (currentPage: number) => {
    this.setState({
      skip: (currentPage-1) * this.state.limit,
    }, () => {
      this.replaceHistory();
      this.fetchPartsData();
    })
  }

  private onLimitChange = (limit: number) => {
    this.setState({
      limit,
    }, () => {
      this.replaceHistory();
      this.fetchPartsData();
    })   
  }

  private replaceHistory() {
    const {userFilter, skip, limit} = this.state;
    this.props.history.replace({search: qs.stringify({
      userFilter,
      skip,
      limit,
    })});
  }

  private onFilterUserChange = (value: string) => {
    const {skip, limit} = this.state;
    this.setState({userFilter: value}, ()=>{
      this.replaceHistory();
      this.fetchPartsData();
    });
  }

  private onTableSortChange = (sortProp: {column:any, order:'ascending'|'descending', prop:string}) => {
    const {order, prop} = sortProp;
    this.setState({sortMethod: {order, prop}}, this.fetchPartsData);
  }

  private exportToXlsxCurrentPage = async () => {
    const {skip, limit } = this.state;
    this.exportToXlsx(skip, limit);
  }
  private exportToXlsxAllPages = async () => {
    this.exportToXlsx(undefined, undefined);
  }

  private exportToXlsx = async (skip?:number, limit?:number) => {
    const {sampleType} = this.props;
    const {userFilter, sortMethod} = this.state;

    const params = (skip!==undefined && limit!==undefined) ? qs.stringify({
      type: sampleType,
      skip,
      limit,
      user: userFilter,
      sortBy: sortMethod.prop,
      desc: sortMethod.order === 'descending' ? true : false,
      format: 'xlsx',
    }) : qs.stringify({
      type: sampleType,
      user: userFilter,
      sortBy: sortMethod.prop,
      desc: sortMethod.order === 'descending' ? true : false,
      format: 'xlsx',
    })

    const res = await axios({
      url: serverURL+'/api/parts?'+params,
      method: 'GET',
      responseType: 'blob', // important
      ...getAuthHeader(),
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'export.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  private generateCoulumnTitle () :Array<IColumn|IExpandedPanel> {
    const {sampleType} = this.props;
    switch (sampleType) {
      case 'bacterium':
        return this.generateBacteriumColumnTitle();
      case 'primer':
        return this.generatePrimerColumnTitle();
      case 'yeast':
        return this.generateYeastColumnTitle();
    }
    return [];
  }

  private generateBacteriumColumnTitle() :Array<IColumn|IExpandedPanel> {
    const {userId} = this.props;
    return [
      {
        type: 'expand',
        expandPannel: data => {
          const attachmentRows = data && data.attachments && data.attachments.map(att => 
            <div key={att.fileId}>
              <a href={`/parts/attachment/${att.fileId}`}
                onClick={this.onClickAttachment.bind(this,att.fileId, att.fileName)}
              >
                {att.fileName},
                {fileSizeHumanReadable(att.fileSize)}
              </a>
            </div>);
          return <div className="partDetailPanel"style={{width:'100%'}}>
            <Table
              style={this.detailTableStyle}
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
                {key: 'created at', value: data.createdAt},
              ]}
            />
          {data.attachments && data.attachments.length > 0 &&
            (<div style={{marginTop:10, marginBottom: 5}}> 
              <div><b>attachments</b></div> 
              {attachmentRows}
            </div>
          )}
          </div>
        },
      },
      {
        label: "lab name",
        prop: "labName",
        sortable: "custom",
        width:100,
      },
      {
        label: "personal name",
        prop: "personalName",
        sortable: "custom",
        width:100,
      },
      {
        label: "other names",
        prop: "tags",
        sortable: "custom",
        width:100,
      },
      {
        label: "host strain",
        prop: "hostStrain",
        sortable: "custom",
        width: 180,
      },
      {
        label: "comment",
        prop: "comment",
        sortable: "custom",
        minWidth: 200,
        render: (row, column, index) =>
          <div style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>{row.comment}</div> 
      },
      {
        label: "markers",
        prop: "markers",
        sortable: "custom",
        width: 100,
      },
      {
        label: "date",
        prop: "date",
        sortable: "custom",
        width: 180,
      },
      {
        label: "...",
        prop: "attachments",
        width: 100,
        render: (row, column, index) =>
        <div>
          {row.attachments&& row.attachments[0] &&
            (<a href={`/parts/attachment/${row.attachments[0].id}`}
              onClick={this.onClickAttachment.bind(this,row.attachments[0].fileId, row.attachments[0].fileName)}
            >
              <Icon name="document" />
            </a>)
          }
          {row.ownerId === userId && <Button type="text" icon="delete2" onClick={this.onClickDeletePart.bind(this, row)} />}
        </div>
      }
      ];
    }
    
    private generatePrimerColumnTitle () :Array<IColumn|IExpandedPanel>{
      return [
      {
        type: 'expand',
        expandPannel: data => {
          const attachmentRows = data && data.attachments&& data.attachment.map(att => 
          <div key={att.fileId}>
            <a href={`/parts/attachment/${att.fileId}`}
              onClick={this.onClickAttachment.bind(this,att.fileId, att.fileName)}
            >
              {att.fileName},
              {fileSizeHumanReadable(att.fileSize)}
            </a>
          </div>);
          return <div className="partDetailPanel"style={{width:'100%'}}>
            <Table
              style={this.detailTableStyle}
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
                {key: 'description', value: data.comment},
                {key: 'sequence', value: data.sequence},
                {key: 'orientation', value: data.orientation},
                {key: 'melting temperature', value: data.meltingTemperature},
                {key: 'concentration', value: data.concentration},
                {key: 'vendor', value: data.vendor},
              ]}
            />
          {data.attachments&& data.attachment.length > 0 &&
            (<div style={{marginTop:10, marginBottom: 5}}> 
              <div><b>attachments</b></div> 
              {attachmentRows}
            </div>
          )}
          </div>
        },
      },
      {
        label: "lab name",
        prop: "labName",
        sortable: "custom",
        width:100,
      },
      {
        label: "personal name",
        prop: "personalName",
        sortable: "custom",
        width:150,
      },
      {
        label: "other names",
        prop: "tags",
        sortable: "custom",
        width:100,
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
      },
      {
        label: "att",
        prop: "attachment",
        width: 50,
        render: (row, column, index) =>
        <div>
          {row.attachments&& row.attachments[0] &&
            (<a href={`/parts/attachment/${row.attachments[0].id}`}
              onClick={this.onClickAttachment.bind(this,row.attachments[0].fileId, row.attachments[0].fileName)}
            >
              <Icon name="document" />
            </a>)
          }
        </div>
      }
      ];
    }

    private generateYeastColumnTitle () :Array<IColumn|IExpandedPanel>{
      return [
        {
          type: 'expand',
          expandPannel: data => {
            const attachmentRows = data && data.attachments&& data.attachment.map(att => 
            <div key={att.fileId}>
              <a href={`/parts/attachment/${att.fileId}`}
                onClick={this.onClickAttachment.bind(this,att.fileId, att.fileName)}
              >
                {att.fileName},
                {fileSizeHumanReadable(att.fileSize)}
              </a>
            </div>);
            return <div className="partDetailPanel"style={{width:'100%'}}>
              <Table
                style={this.detailTableStyle}
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
                  {key: 'description', value: data.comment},
                  {key: 'parents', value: data.parents},
                  {key: 'genotype', value: data.genotype},
                  {key: 'plasmidType', value: data.plasmidType},
                  {key: 'markers', value: data.markers},
                ]}
              />
            {data.attachments&& data.attachment.length > 0 &&
              (<div style={{marginTop:10, marginBottom: 5}}> 
                <div><b>attachments</b></div> 
                {attachmentRows}
              </div>
            )}
            </div>
          },
        },
        {
          label: "lab name",
          prop: "labName",
          sortable: "custom",
          width:100,
        },
        {
          label: "personal name",
          prop: "personalName",
          sortable: "custom",
          width:150,
        },
        {
          label: "other names",
          prop: "tags",
          sortable: "custom",
          width:100,
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
          label: "parents",
          prop: "parents",
          sortable: "custom",
          width: 180,
        },
        {
          label: "markers",
          prop: "markers",
          sortable: "custom",
          width: 180,
        },
        {
          label: "date",
          prop: "date",
          sortable: "custom",
          width: 180,
        },
        {
          label: "att",
          prop: "attachment",
          width: 50,
          render: (row, column, index) =>
          <div>
            {row.attachments&& row.attachments[0] &&
              (<a href={`/parts/attachment/${row.attachments[0].id}`}
                onClick={this.onClickAttachment.bind(this,row.attachments[0].fileId, row.attachments[0].fileName)}
              >
                <Icon name="document" />
              </a>)
            }
          </div>
        }
        ];
    }

  private async getCount () {
    const {sampleType} = this.props;
    const {userFilter} = this.state;
    const res = await axios.get(serverURL+'/api/parts/count?'+qs.stringify({
      type: sampleType,
      ownerId: userFilter,
    }),
    getAuthHeader());
    return res.data.count;
  }

  private async fetchPartsData() {
    const {sampleType} = this.props;
    const {skip, limit, userFilter, sortMethod} = this.state;

    const total = await this.getCount();
    this.setState({total, loading: true});
    
    const res = await axios.get(serverURL+'/api/parts?'+qs.stringify({
      type: sampleType,
      skip,
      limit,
      user: userFilter,
      sortBy: sortMethod.prop,
      desc: sortMethod.order === 'descending' ? true : false,
    }),
    getAuthHeader());
    console.log(res)

    let data = [];
    switch (sampleType) {
    case 'bacterium':
      data = res.data.map(item => ({
        _id: item._id,
        labName: item.labName,
        personalName: item.personalName,
        tags: item.tags ? item.tags.join('; ') : '',
        hostStrain: item.content.hostStrain ? item.content.hostStrain : '',
        markers: item.content.markers ? item.content.markers.join('; ') : '',
        date: item.date ? (new Date(item.date)).toLocaleDateString() : '',
        comment: item.comment ? item.comment : '',
        ownerId: item.ownerId,
        ownerName: item.ownerName,
        createdAt: item.createdAt,
        attachments: item.attachments,
      }))
    break;
    case 'primer':
      data = res.data.map(item => ({
        _id: item._id,
        labName: item.labName,
        personalName: item.personalName,
        tags: item.tags ? item.tags.join('; ') : '',
        date: item.date ? (new Date(item.date)).toLocaleDateString() : '',
        comment: `${item.content.description} ${item.comment}`,
        attachments: item.attachments,
        sequence: item.content.sequence,
        orientation: item.content.orientation,
        meltingTemperature: item.content.meltingTemperature,
        concentration: item.content.concentration,
        vendor: item.content.vendor,
        ownerId: item.ownerId,
        ownerName: item.ownerName,
        createdAt: new Date(item.createdAt).toLocaleDateString(),
      }))
    break;
    case 'yeast':
      data = res.data.map(item => ({
        _id: item._id,
        labName: item.labName,
        personalName: item.personalName,
        tags: item.tags ? item.tags.join('; ') : '',
        date: item.date ? (new Date(item.date)).toLocaleDateString() : '',
        comment: item.comment,
        ownerId: item.ownerId,
        ownerName: item.ownerName,
        createdAt: item.createdAt,
        attachments: item.attachments,
        
        parents: item.content.parents ? item.content.parents.join('; ') : '' ,
        genotype: item.content.genotype ? item.content.genotype.join('; ') : '' ,
        plasmidType: item.content.plasmidType,
        markers: item.content.markers ? item.content.markers.join('; ') : '' ,
      }))
    break;
    }

    this.setState({data, loading:false});
  }

  private async deletePart(id:string) {
    try {
      const res = await axios({
        url: serverURL+`/api/part/${id}`,
        method: 'DELETE',
        ...getAuthHeader(),
      });
      this.fetchPartsData();
      Message.success('deleted');
    } catch (err) {
      if (err.response) {
        Message.error(err.response.data.message);
      } else {
        Message.error('unable to delete')
      }
    }
  }

  // when clicking on the attachment link, download the attachment
  private onClickAttachment = async (fileId: string, fileName: string, e:React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    const res = await axios({
      url: serverURL+`/api/attachments/${fileId}`,
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

  private onClickDeletePart = async (data:any) => {
    const id = data._id;
    MessageBox.confirm('delete this part? this operation CANNOT be undone', 'warning', {
      type: 'warning'
    }).then(() => {
      // confirm deleting part
      this.deletePart(id);
    }).catch(() => {
      Message({
        type: 'info',
        message: 'canceled'
      });
    });
  }

  private rowStyle = ()=>({border:0})

}

const mapStateToProps = (state :IStoreState) => ({
  partsCount: state.partsCount,
  allUsers: state.allUsers,
  newPartDialogVisible: state.newPartDialogVisible,
  loggedIn: state.loggedIn,
  userId: state.userId,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  getUserList: ()=>dispatch({type:'GET_USER_LIST'}),
  setNewPartDialogVisible: visible => dispatch(ActionSetNewPartDialogVisible(visible)),
  getParts: data => dispatch({type:'GET_PARTS', data})
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(PartsList))
