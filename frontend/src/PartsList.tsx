import * as React from 'react'
import axios from 'axios'
// import { serverURL } from './config'
// import getAuthHeader from './authHeader'
import { Table } from 'element-react'
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
  width: number,
}

interface IProps {
  sampleType: string,
}

interface IState {
  columns: IColumn[],
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
    return (
      <Table
        style={{width: '100%'}}
        columns={this.state.columns}
        data={this.state.data}
        stripe={true}
      />
    )
  }

  private generateCoulumTitle () {
    const {sampleType} = this.props;
    if (sampleType === 'bacterium') {
      return [
        {
          label: "lab name",
          prop: "labName",
          width: 180,
        },
        {
          label: "personal name",
          prop: "personalName",
          width: 180,
        },
        {
          label: "other names",
          prop: "tags",
          width: 180,
        },
        {
          label: "host strain",
          prop: "hostStrain",
          width: 180,
        },
        {
          label: "comment",
          prop: "comment",
          width: 180,
        },
        {
          label: "markers",
          prop: "markers",
          width: 180,
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
      date: item.date ? '' : '',
      comment: item.comment ? item.comment : '',
    }))

    console.log(data);

    this.setState({data});
  }

}

const mapStateToProps = (state :IStoreState) => ({
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(PartsList))
