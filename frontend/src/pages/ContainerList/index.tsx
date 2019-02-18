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
  IContainer,
} from 'types'

// react
import * as React from 'react'
import qs from 'qs'

// redux
import { Dispatch } from 'redux'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import {
  GET_CONTAINER_LIST,
  SET_CONTAINER_LIST,
  SET_SKIP,
  SET_LIMIT,
  } from './actions';

// react-router
import {Redirect} from 'react-router'

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
import { getParts } from 'saga';


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

interface IProps extends IReactRouterProps {
  loggedIn: boolean,
  total: number,
  limit: number,
  skip: number,
  loading: boolean,
  containers: IContainer[],

  getContainers: (skip: number, limit: number) => void,
  setSkip: (val:number) => void,
  setLimit: (val:number) => void,
}

interface IState {

}

const mapStateToProps = (state :IStoreState) => ({
  loggedIn: state.user.loggedIn,
  containers: state.container.containers,
  skip: state.container.skip,
  limit: state.container.limit,
  total: state.container.total,
  loading: state.container.loading,

})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  getContainers: (skip: number, limit: number) => dispatch({type:GET_CONTAINER_LIST, data:{skip, limit}}),
  setSkip: (val:number) => dispatch({type:SET_SKIP, data: val}),
  setLimit: (val:number) => dispatch({type:SET_LIMIT, data: val}),
})

class ContainerList extends React.Component<IProps, IState> {

  constructor(props) {
    super(props);
  }

  public componentDidMount () {
    const {skip,limit} = this.props;
    this.props.getContainers(skip, limit);
  }

  public render() {

    const {
      total,
      limit,
      skip,
      loading,
      } = this.props;

    if (!this.props.loggedIn) {
      console.log('not logged in, why?', this.props, this.state);
      return <Redirect to="/" />
    }

    const columns = [
      {
        label: "type",
        prop: "ctype",
        align: "right",
        width: 200,
      },
      {
        label: "barcode",
        prop: "barcode",
      },
      {
        label: "assignedAt",
        prop: "assignedAt",
        render: (data) => <div>{this.format(data.assignedAt)}</div>
      },
      {
        label: "operatorId",
        prop: "operatorId",
      },
      {
        label: "parentContainer",
        prop: "parentContainer",
      },
      {
        label: "locationBarcode",
        prop: "locationBarcode",
      },
      {
        label: "currentStatus",
        prop: "currentStatus",
      },
    ]

    return (
      <ErrorBoundary>
        <FlexPanel>
          <h1>Containers</h1>
          {/* <div style={{marginLeft:100,marginRight:100, minWidth:'50%'}}>
            <FlexRow>
              <Title>Search</Title>
              <PartsSearchBar onSearch={this.props.setSearchKeyword}/>
            </FlexRow>
          </div> */}
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
                columns={columns}
                data={this.props.containers}
                stripe={true}
                // onSortChange={this.onTableSortChange}
                // onSelectChange={this.onSelectChange}
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
    const {skip, limit} = props;
    let pathName = props.history.location.pathname;
    pathName += '?';
    const page = Math.floor(skip / limit);
    const query = {
      page: page === 0 ? undefined : page,
      limit: limit === 10 ? undefined : limit,
    }
    props.history.replace(`${pathName}${qs.stringify(query)}`);
    
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
    // this.setState({selectedIds: selection.map(v => v._id)})
  }

  // protected generateExpandTablePanel() {
  //   return {
  //       type: 'expand',
  //       expandPannel: data => {
  //         const attachmentRows = data && data.attachments && data.attachments.map(att => 
  //           <div key={att.fileId}>
  //             <a
  //               onClick={this.onClickAttachment.bind(this,att.fileId, att.fileName)}
  //             >
  //               {att.fileName},
  //               {fileSizeHumanReadable(att.fileSize)}
  //             </a>
  //           </div>);

  //         let otherData:any[] = [], customData:any[] = [];
  //         if (data.content) {
  //           otherData = Object.keys(data.content).filter(key => ['customData'].indexOf(key) < 0).map(key => ({key, value: this.format(data.content[key])}));
  //           if (data.content.customData) {
  //             customData = Object.keys(data.content.customData).map(key => ({key, value: this.format(data.content.customData[key])}));
  //           }
  //         }
  //         return <div className="partDetailPanel"style={{width:'100%'}}>
  //           <FullWidthTable
  //             rowStyle={this.rowStyle}
  //             showHeader={false}
  //             columns={[
  //               {
  //                 label: "key",
  //                 prop: "key",
  //                 align: "right",
  //                 width: 200,
  //               },
  //               {
  //                 label: "value",
  //                 prop: "value",
  //               },
  //             ]}
  //             data={[
  //               {key: 'comment', value: data.comment},
  //               {key: 'creator', value: data.ownerName},
  //               {key: 'created at', value: new Date(data.createdAt).toLocaleDateString()},
  //               {key: 'updated at', value: new Date(data.createdAt).toLocaleDateString()},
  //               // other data
  //               ...otherData,
  //               // custom data
  //               ...customData,
  //             ]}
  //           />
  //         {data.attachments && data.attachments.length > 0 &&
  //           (<div style={{marginTop:10, marginBottom: 5}}> 
  //             <div><b>attachments</b></div> 
  //             {attachmentRows}
  //           </div>
  //         )}
  //         {/* {JSON.stringify(data)} */}
  //         </div>
  //       },
  //     }
  // }

  // protected generateColumnTitle () :Array<IColumn|IExpandedPanel>{
  //   const {userId} = this.props;
  //   return [
  //     {
  //       type: 'selection',
  //     },
  //     this.generateExpandTablePanel(),
  //     {
  //       label: "lab name",
  //       prop: "labName",
  //       sortable: "custom",
  //       width:100,
  //     },
  //     {
  //       label: "personal name",
  //       prop: "personalName",
  //       sortable: "custom",
  //       width:150,
  //     },
  //     {
  //       label: "other names",
  //       prop: "tags",
  //       sortable: "custom",
  //       width:100,
  //       render: (data, column, index) =>
  //         <div style={{
  //           overflow: 'hidden',
  //           textOverflow: 'ellipsis',
  //           whiteSpace: 'nowrap',
  //         }}>{this.format(data.tags)}</div> 
  //     },
  //     {
  //       label: "comment",
  //       prop: "comment",
  //       sortable: "custom",
  //       minWidth: 200,
  //       render: (data, column, index) =>
  //         <div style={{
  //           overflow: 'hidden',
  //           textOverflow: 'ellipsis',
  //           whiteSpace: 'nowrap',
  //         }}>{data.description} {data.comment}</div> 
  //     },
  //     {
  //       label: "date",
  //       prop: "date",
  //       sortable: "custom",
  //       width: 180,
  //       render: (data) => (new Date(data.createdAt).toLocaleDateString())
  //     },
  //     {
  //       label: "...",
  //       prop: "attachment",
  //       width: 100,
  //       render: (row, column, index) =>
  //       <div>
  //         {row.attachments&& row.attachments[0] &&
  //           (<a
  //             onClick={this.onClickAttachment.bind(this,row.attachments[0].fileId, row.attachments[0].fileName)}
  //           >
  //             <MyClickableIcon type="text" icon="document"/>
  //           </a>)
  //         }
  //         {row.ownerId === userId && <MyClickableIcon type="text" icon="edit" onClick={this.onClickEditPart.bind(this, row)} />}
  //         {row.ownerId === userId && <MyClickableIcon type="text" icon="delete2" onClick={this.onClickDeletePart.bind(this, row)} />}
  //       </div>
  //     }
  //     ];
  // }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(ContainerList))
