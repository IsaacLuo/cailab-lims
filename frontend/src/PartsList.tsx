import * as React from 'react'
import axios from 'axios'
// import { serverURL } from './config'
// import getAuthHeader from './authHeader'
import { Table, Pagination } from 'element-react'
import getAuthHeader from './authHeader'

// redux
import { IStoreState } from './store'
import { Dispatch } from 'redux'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { serverURL } from './config'
import qs from 'qs'

interface IColumn {
  label: string,
  prop: string,
  width?: number,
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
}

class PartsList extends React.Component<IProps, IState> {
  constructor(props) {
    super(props);

    this.state = {
      columns: this.generateCoulumTitle(),
      data: [],
      skip: 0,
      limit: 10,
    };
    
    this.getData();
  }
  
  public render() {
    const {skip, limit} = this.state;
    return (
      <div style={{width:'100%'}}>
        <Table
          style={{width: '100%'}}
          columns={this.state.columns}
          data={this.state.data}
          stripe={true}
        />
        <Pagination
          layout="prev, pager, next, jumper"
          total={this.getCount()}
          pageSize={limit}
          currentPage={Math.floor(skip/limit)+1}
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

  private generateCoulumTitle () {
    const {sampleType} = this.props;
    if (sampleType === 'bacterium') {
      return [
        {
          type: 'expand',
          expandPannel: data =>
          <div>
            {data.comment}
          </div>,
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
        ];
    } else {
      return [];
    }
  }

  private getCount() {
    const {sampleType, partsCount} = this.props;
    const myDict = {
      bacterium: 'bacteria',
      primer: 'primers',
      yeast: 'yeasts',
    }
    return partsCount[myDict[sampleType]];
  }

  private async getData() {
    const {sampleType} = this.props;
    const {skip, limit} = this.state;
    
    const res = await axios.get(serverURL+'/api/parts?'+qs.stringify({
      type: sampleType,
      skip,
      limit,
    }),
    getAuthHeader());
    console.log(res)

    const data = res.data.map(item => ({
      labName: item.labName,
      personalName: item.personalName,
      tags: item.content.tags ? item.content.tags.join('; ') : '',
      hostStrain: item.content.hostStrain ? item.content.hostStrain : '',
      markers: item.content.markers ? item.content.markers.join('; ') : '',
      date: item.date ? (new Date(item.date)).toLocaleDateString() : '',
      comment: item.comment ? item.comment : '',
    }))

    console.log(data);

    this.setState({data});
  }

}

const mapStateToProps = (state :IStoreState) => ({
  partsCount: state.partsCount,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(PartsList))
