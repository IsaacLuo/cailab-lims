/**
 * SearchTubeBarcode
 */

// types
import {
  IStoreState,
  IReactRouterProps,
  IPart,
} from '../../types'

// react
import * as React from 'react'


// redux
import { Dispatch } from 'redux'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'

import styled from 'styled-components'
import { GET_PART } from './actions';
import PartTable from '../../components/PartTable';
import ContainerTable from '../../components/ContainerTable';
import PartAttachments from '../../components/PartAttachments';
import Discussion from '../../components/Discussion';

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
        <h3>discussion</h3>
        <Discussion/>
      </div>
      :
      <h1>invalid part</h1>
      }
    </MainPanel>
  }
}



export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Part))
