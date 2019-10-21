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

// components
import {
  Input,
} from 'element-react'
import styled from 'styled-components'
import { GET_PART } from './actions';
import CentralPanel from '../../components/CentralPanel';
import PartTable from '../../components/PartTable';
import ObjectTable from '../../components/ObjectTable';

const MessagePanel = styled.div`
  min-height: 2em;
`

interface IProps extends IReactRouterProps {
  tube?:ITube,
  message: string,
  searchPart: (id:string) => void,
}

interface IState {
  barcode: string,
}

const mapStateToProps = (state :IStoreState) => ({
  message: state.searchTubeBarcode.message,
  tube: state.searchTubeBarcode.tube,
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
    if(this.props.match && this.props.match.params && this.props.match.params.barcode) {
      this.props.searchPart(this.props.match.params.barcode);
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
        this.props.searchPart(barcode);
      }
    }
  }

  public render() {
    const {tube} = this.props;
    let part;
    if (tube) {
      part = tube.part;
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
          <h2>tube</h2>
          {tube && <ObjectTable object={tube} keys={['barcode', 'assignedAt', 'currentStatus', 'wellName']} />}
          <h2>part</h2>
          {part && <PartTable part={part} />}
        </div>
      </CentralPanel>
  }

  private onChangeBarcode = (barcode) => {
    this.setState({barcode});
  }

  private onInputKeyUp = (event) => {
    if (event.keyCode === 13) {
      const {barcode} = this.state;
      this.props.searchPart(barcode);
      this.props.history.push(this.props.match.path.replace(':barcode','')+`${barcode}`);
      event.target.select();
    }
  }
}



export default withRouter(connect(mapStateToProps, mapDispatchToProps)(SearchTubeBarcode))
