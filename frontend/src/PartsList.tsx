import * as React from 'react'
import axios from 'axios'
// import { serverURL } from './config'
import { Table, Pagination, Icon, Loading } from 'element-react'
import getAuthHeader from './authHeader'
import {fileSizeHumanReadable} from './tools'

// redux
import { IStoreState } from './store'
import { Dispatch } from 'redux'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { serverURL } from './config'

// react-router
// import { Link } from 'react-router-dom'
import qs from 'qs'

interface IColumn {
  label: string,
  prop: string,
  width?: number,
  minWidth?: number,
  render?: (data:any, column:any, index:number) => void,
}

interface IExpandedPanel {
  type: string,
  expandPannel: (data:any) => JSX.Element,
}

interface IPartsCount {
  bacteria: number,
  primers: number,
  yeasts: number,
}

interface IProps {
  sampleType: string,
  partsCount: IPartsCount,
}

interface IState {
  columns: Array<IColumn|IExpandedPanel>,
  data: any[],
  skip: number,
  limit: number,
  total: number,
  loading: boolean,
}

class PartsList extends React.Component<IProps, IState> {

  private detailTableStyle :React.CSSProperties= {
    width:'100%',
  }

  // private detailTableKeyStyle :React.CSSProperties = {
  //   textAlign: 'right',
  //   width: '30%',
  //   paddingRight: 10,
  // }
  
  // private detailTableValueStyle :React.CSSProperties = {
  //   textAlign: 'left',
  //   width: '70%',
  //   paddingLeft: 10,
  // }

  constructor(props) {
    super(props);

    this.state = {
      columns: this.generateCoulumTitle(),
      data: [],
      skip: 0,
      limit: 10,
      total: 0,
      loading: true,
    };
    this.getData();
  }
  
  public render() {
    const {skip, limit, total, loading} = this.state;
    return (
      <div style={{width:'100%'}}>
      
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
        />
              </Loading>
        <Pagination
          layout="prev, pager, next"
          total={total}
          pageSize={limit}
          currentPage={Math.floor(skip/limit)+1}
          onSizeChange={this.onLimitChange}
          onCurrentChange={this.onPageChange}
        />
      </div>
      
    )
  }

  private onPageChange = (currentPage: number) => {
    this.setState({
      skip: (currentPage-1) * this.state.limit,
    }, () => {
      this.getData();
    })
  }

  private onLimitChange = (limit: number) => {
    this.setState({
      limit,
    }, () => {
      this.getData();
    })   
  }

  private generateCoulumTitle () :Array<IColumn|IExpandedPanel> {
    const {sampleType} = this.props;
    if (sampleType === 'bacterium') {
      return [
        {
          type: 'expand',
          expandPannel: data => {
            const attachmentRows = data && data.attachment && data.attachment.map(att => 
            <div key={att.fileId}>
              <a href="#"
                onClick={this.onClickAttachment.bind(this,att.fileId, att.fileName)}
              >
                {att.fileName},
                {fileSizeHumanReadable(att.fileSize)}
              </a>
            </div>);
            return <div>
              <div>{data.comment}</div>
              {data.attachment && 
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
          width:100,
        },
        {
          label: "personal name",
          prop: "personalName",
          width:100,
        },
        {
          label: "other names",
          prop: "tags",
          width:100,
        },
        {
          label: "host strain",
          prop: "hostStrain",
          width: 180,
        },
        {
          label: "comment",
          prop: "comment",
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
          width: 100,
        },
        {
          label: "date",
          prop: "date",
          width: 180,
        },
        {
          label: "att",
          prop: "attachment",
          width: 50,
          render: (row, column, index) =>
          <div>
            {row.attachment && row.attachment[0] &&
              (<a href="#"
                onClick={this.onClickAttachment.bind(this,row.attachment[0].fileId, row.attachment[0].fileName)}
              >
                <Icon name="document" />
              </a>)
            }
          </div>
        }
        ];
    } else if (sampleType === 'primer') {
      return [
        {
          type: 'expand',
          expandPannel: data => {
            const attachmentRows = data && data.attachment && data.attachment.map(att => 
            <div key={att.fileId}>
              <a href="#"
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
            {data.attachment && data.attachment.length > 0 &&
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
          width:100,
        },
        {
          label: "personal name",
          prop: "personalName",
          width:150,
        },
        {
          label: "other names",
          prop: "tags",
          width:100,
        },
        {
          label: "comment",
          prop: "comment",
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
          width: 180,
        },
        {
          label: "att",
          prop: "attachment",
          width: 50,
          render: (row, column, index) =>
          <div>
            {row.attachment && row.attachment[0] &&
              (<a href="#"
                onClick={this.onClickAttachment.bind(this,row.attachment[0].fileId, row.attachment[0].fileName)}
              >
                <Icon name="document" />
              </a>)
            }
          </div>
        }
      ];
    } else {
      return [];
    }
  }

  // private generateDetailTableColumns (data: any, keys: string[]) {
  //   return <table style={this.detailTableStyle}>
  //     <tbody>
  //       {keys.map(key => <tr key={key}>
  //         <td style={this.detailTableKeyStyle}>{key}</td>
  //         <td style={this.detailTableValueStyle}>{data.key}</td>
  //         </tr>)}
  //     </tbody>
  //   </table>
  // }

  private async getCount () {
    const {sampleType} = this.props;
    const res = await axios.get(serverURL+'/api/parts/count?'+qs.stringify({
      type: sampleType,
    }),
    getAuthHeader());
    return res.data.count;
  }

  private async getData() {
    const {sampleType} = this.props;
    const {skip, limit} = this.state;

    const total = await this.getCount();
    this.setState({total, loading: true})
    
    const res = await axios.get(serverURL+'/api/parts?'+qs.stringify({
      type: sampleType,
      skip,
      limit,
    }),
    getAuthHeader());
    console.log(res)

    let data = [];
    switch (sampleType) {
    case 'bacterium':
      data = res.data.map(item => ({
        labName: item.labName,
        personalName: item.personalName,
        tags: item.content.tags ? item.content.tags.join('; ') : '',
        hostStrain: item.content.hostStrain ? item.content.hostStrain : '',
        markers: item.content.markers ? item.content.markers.join('; ') : '',
        date: item.date ? (new Date(item.date)).toLocaleDateString() : '',
        comment: item.comment ? item.comment : '',
        attachment: item.attachment,
      }))
    break;
    case 'primer':
      data = res.data.map(item => ({
        labName: item.labName,
        personalName: item.personalName,
        tags: item.content.tags ? item.content.tags.join('; ') : '',
        date: item.date ? (new Date(item.date)).toLocaleDateString() : '',
        comment: `${item.content.description} ${item.comment}`,
        attachment: item.attachment,
        sequence: item.content.sequence,
        orientation: item.content.orientation,
        meltingTemperature: item.content.meltingTemperature,
        concentration: item.content.concentration,
        vendor: item.content.vendor,
      }))
    break;
    }

    this.setState({data, loading:false});
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

  private rowStyle = ()=>({border:0})

}

const mapStateToProps = (state :IStoreState) => ({
  partsCount: state.partsCount,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(PartsList))
