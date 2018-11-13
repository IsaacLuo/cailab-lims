import * as React from 'react'
// react-router-redux
import { IStoreState } from '../types';
import { withRouter, Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import {Menu, Button} from 'element-react'
import styled from 'styled-components'

const PartRow = styled.div`
  margin: 10px;
`
const Panel = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`

export interface IProps {
  currentBasket:any,
  getCurrentBasket: ()=>void,
  deleteItemFromBasket: (basketId:string, partId:string) => void,
  clearBasket: (basketId:string,)=>void,
}

class Basket extends React.Component<IProps, any> {
  constructor(props :IProps) {
    super(props);
  }

  public componentDidMount () {
    this.props.getCurrentBasket();
  }

  public render() {
    const {currentBasket} = this.props;
    let parts:any[] = [];
    if (currentBasket && currentBasket.parts) {
      parts = currentBasket.parts.map( v=> <PartRow key={v._id}>
        {v.personalName}
        <Button type="primary" icon="delete" size="mini"
          onClick={this.props.deleteItemFromBasket.bind(this,currentBasket._id, v._id)}
        />
      </PartRow>)
    }

    return (
      <div>
        <p>you have {currentBasket.partsCount? currentBasket.partsCount: 0} items in basket</p>
        
        {currentBasket &&
          <Panel>
            <p>created at: {(new Date(currentBasket.createdAt)).toLocaleDateString()}</p>
            <p>updated at: {(new Date(currentBasket.updatedAt)).toLocaleDateString()}</p>
            {parts}
          </Panel>
        }
        {currentBasket.partsCount > 0 &&
        <p>
          <Button type="primary" icon="delete"
          onClick={this.props.clearBasket.bind(this,currentBasket._id)}
          >delete all</Button>
        </p>
        }
      </div>
    );
  }
}

const mapStateToProps = (state :IStoreState) => ({
  currentBasket: state.currentBasket,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  getCurrentBasket: () => dispatch({type:'GET_CURRENT_BASKET'}),
  deleteItemFromBasket: (basketId:string, partId:string) => dispatch({type:'DELETE_PART_FROM_BASKET', data:{basketId, partId}}),
  clearBasket: (basketId:string) =>dispatch({type:'CLEAR_BASKET', data:basketId}),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Basket))