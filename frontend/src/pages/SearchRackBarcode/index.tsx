/**
 * SearchTubeBarcode
 */

// types
import {
  IStoreState,
  IReactRouterProps,
  ITube,
} from '../../types'

// react
import * as React from 'react'

// redux
import { Dispatch } from 'redux'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'

// react-router
import {Link} from 'react-router-dom'


// components
import {
  Input,
} from 'element-react'
import styled from 'styled-components'
import { GET_RACK } from './actions';
import CentralPanel from '../../components/CentralPanel';

const MainPanel = styled.div`
  width:90%;
`

const MessagePanel = styled.div`
  min-height: 2em;
`

const RackPanel = styled.div`
  display:flex;
  flex-direction: column;
  width: 100%;
`
const RackRow = styled.div`
  display:flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
`
const RackWell = styled.div`
  padding: 5px;
  margin:5px;
  border: solid 1px black;
  flex-grow: 1;
  flex-shrink: 0;
  width: 100px;
  font-size:12px;
  word-break: break-all;
`

const WellName = styled.div`
  color: #aaa;
`

const WellBarcode = styled.div`
  color: #aaa;
`

interface IProps extends IReactRouterProps {
  tubes?:ITube[],
  message: string,
  searchRack: (id:string) => void,
}

interface IState {
  barcode: string,
}

const mapStateToProps = (state :IStoreState) => ({
  message: state.searchRackBarcode.message,
  tubes: state.searchRackBarcode.tubes,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  searchRack: (barcode:string) => dispatch({type:GET_RACK, data:{barcode,}}),
})

class SearchRackBarcode extends React.Component<IProps, IState> {
  constructor(props) {
    super(props);
    this.state = {
      barcode: '',
    }
    if(this.props.match && this.props.match.params && this.props.match.params.barcode) {
      this.props.searchRack(this.props.match.params.barcode);
      this.state = {
        barcode: this.props.match.params.barcode,
      }
    }

  }

  public componentWillReceiveProps(np: IProps) {
    if(np.match.url !== this.props.match.url) {
      const barcode = np.match.params.barcode;
      if(barcode) {
        this.setState({barcode});
        this.props.searchRack(barcode);
      }
    }
  }

  public render() {
    const {tubes} = this.props;

    const rows = 8;
    const cols = 12;
    const rack = new Array(rows);
    for (let i = 0;i<rows;i++) {
      rack[i] = new Array(cols);
      for (let j = 0;j<cols;j++) {
        rack[i][j] = undefined;
      }
    }
    if (tubes) {
      tubes.forEach(tube => {
        const row = Math.floor(tube.wellId/12);
        const col = tube.wellId%12;
        rack[row][col] = <RackWell key={tube.wellId}>
        <WellName>{tube.wellName}</WellName>
        <WellBarcode>{tube.barcode}</WellBarcode>
        {
          tube.part && <div>
            <Link to={`/part/${tube.part._id}`}>{tube.part.personalName}</Link>
          </div>
        }
        </RackWell>
      });
    }
    
    const rackComponent = rack.map((row, idx) => <RackRow className="rackRow" key={idx}>
      {row.map(well => well ? well : <RackWell>N/A</RackWell>)}
    </RackRow>)
    return <CentralPanel>
      <MainPanel>
        <h1>Search Rack Barcode</h1>
        <Input
          value = {this.state.barcode}
          onChange = {this.onChangeBarcode}
          onKeyUp = {this.onInputKeyUp}
        />
        <MessagePanel>{this.props.message}</MessagePanel>
        {
          tubes && tubes.length > 0 && 
        <RackPanel className='rackPanel'>
          {rackComponent}
        </RackPanel>
        }
        
      </MainPanel>
    </CentralPanel>
  }

  private onChangeBarcode = (barcode) => {
    this.setState({barcode});
  }

  private onInputKeyUp = (event) => {
    if (event.keyCode === 13) {
      const {barcode} = this.state;
      this.props.searchRack(barcode);
      this.props.history.push(this.props.match.path.replace(':barcode','')+`${barcode}`);
      event.target.select();
    }
  }
}



export default withRouter(connect(mapStateToProps, mapDispatchToProps)(SearchRackBarcode))
