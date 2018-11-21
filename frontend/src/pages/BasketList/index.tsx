import {
  IStoreState,
  IBasket,
} from 'types'

import * as React from 'react'
// react-router-redux
import { withRouter, Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import {
  ActionSetABasketName,
  ADD_BASKET,
  DELETE_BASKET,
  GET_BASKET_LIST,
  GET_BASKET,
  DELETE_PART_FROM_BASKET,
  SUBMIT_DEFAULT_BASKET_ID,
  SUBMIT_A_BASKET_NAME,
} from './actions'

import {Button, Radio, Table, Input, Notification, Tag} from 'element-react'
import TokenBarcode from 'components/TokenBarcode'
import styled from 'styled-components'

const MyTokenBarcode = styled(TokenBarcode)`
  width:400px;
  height:400px;
`

export interface IProps {
  basketList:IBasket[],
  defaultBasketId:string,
  currentBasket:IBasket,
  getBasketList: ()=>void,
  submitDefaultBasketId:(basketId :string)=>void,
  setABasketName:(basketId:string, basketName :string) => void,
  submitABasketName:(basketId:string, basketName :string) => void,
  getBasket: (basketId:string)=>void,
  deleteAPart: (partId :string, basketId :string) => void  ,
  addBasket: () => void,
  deleteBasket: (basketId:string) => void,
}

interface IState {
  ifEdit: boolean[],
  inputRef: any,
  expandRowKeys: any[],
}

class BasketList extends React.Component<IProps, IState> {
  constructor(props :IProps) {
    super(props);
    this.state = {
      ifEdit:this.props.basketList.map(v=>false), 
      inputRef: undefined,
      expandRowKeys:[],
    }
  }

  public componentDidMount () {
    this.props.getBasketList();
  }

  public componentWillReceiveProps(newProps:IProps) {
    if (newProps.basketList.length !== this.props.basketList.length) {
      this.setState({ifEdit: newProps.basketList.map(v=>false)})
    }
  }

  public render() {
    const {basketList} = {...this.props}
    const length:number = basketList? basketList.length: 0
    const expr:string = length > 1? 'baskets':'basket'

    const tableColumns = [
      {
        type:'expand',
        expandPannel:(data)=> {
          console.log(data)
          const {parts} = data
          console.log(parts)
          if (data.partsCount===0) {
            return (
              <div>No parts</div>
            )
          } else {
            return (
              <div>
                {
                  data.parts.map(v=>(
                    <Tag 
                      style={{margin:'5px', fontSize:'15px'}}
                      key={v._id}
                      closable = {true}
                      type = 'gray'
                      hit = {true}
                      closeTransition = {false}
                      onClose = {this.closeTag.bind(this, data._id, v._id)}
                    >{v.personalName}</Tag>)
                  )
                }
              </div>
            )
          }
        }
      },
      {
        label:'Basket Name', 
        prop:'name', 
        render:(row, column, index)=> {
          // console.log(this.state.ifEdit)
          if (this.state.ifEdit[index] === false) {
            return (
              <div>
                {row.name}<span style={{paddingLeft:'5px', color:'#20a0ff'}} className="el-icon-edit" onClick={this.editBasketName.bind(this, index)}/>
              </div>
            )
          } else {
            return (
              <div>
                <Input value={row.name} size='small' style={{width:'100px'}} 
                onBlur={this.blurBasketName.bind(this, row._id, index)} 
                onChange={this.changeBasketName.bind(this, row._id)} 
                ref={this.getRef} 
                onFocus={this.inputFocus}
                onKeyUp={this.enterBasketName}/>
              </div>
            )
          }
          
        }},
      {
        label:'Parts Count', 
        prop:'partsCount'
      },
      {
        label:'Created At', 
        prop:'createdAt'
      },
      {
        label:'Select Default', 
        prop:'default', 
        render:(row)=>{
          return (
            <div>
              <Radio checked={row._id === this.props.defaultBasketId} value='' name='defaultBastket' 
              onChange={this.changeRadio.bind(this,row._id)}/>
            </div>
          )
        }
      },
      {
        label:'Operation', 
        prop:'name',
        render:(row)=>{
          return (
            <span>
              <Button type="danger" size="small" onClick={this.props.deleteBasket.bind(this,row._id)}>delete</Button>
            </span>)
        }
      }
    ]

    return (
      <div>
        <p>you have {length} {expr}.</p>
        
        <Button onClick={this.onAddBasket}>Add Basket</Button>

        {length > 0 && 
          <Table 
            style={{margin:'auto'}}
            columns = {tableColumns}
            data = {this.props.basketList}
            rowKey = {this.getRowId}
            expandRowKeys = {this.state.expandRowKeys}
            onExpand = {this.expandRow}
          /> }

          <MyTokenBarcode/>
      </div>
    );
  }

  private changeRadio = (id:string)=>{
    this.props.submitDefaultBasketId(id);
  }

  private editBasketName = (index: number) => {
    const newIfEdit = this.state.ifEdit.slice()
    newIfEdit[index] = true
    this.setState({ifEdit:newIfEdit})
  }

  private blurBasketName = (basketId:string, index:number, e:any) =>{
    // console.log(e.target.value)
    const basketName = e.target.value.trim()
    if (basketName === '') {
      Notification.error('The basket name can\'t be empty');
    } else {
      this.props.submitABasketName(basketId, basketName)
      const newIfEdit = this.state.ifEdit.slice()
      newIfEdit[index] = false
      this.setState({ifEdit:newIfEdit, inputRef:undefined})
    }
  }

  private changeBasketName = (basketId:string, value:any) => {
    this.props.setABasketName(basketId, value as string)
  }

  private inputFocus = (e:any) => {
    e.target.select()
  }

  private enterBasketName = (e:any) =>{
    if (e.keyCode === 13) {
      if (this.state.inputRef) {
        this.state.inputRef.blur()
      }
    }
  }

  private getRef = (input:any) => {
    if(input){
      this.setState({inputRef:input})
      input.focus()
    }
  }

  private getRowId = (row: any) => {
    return row._id
  }

  private expandRow = (row, expanded) => {
    if (expanded) {
      const basketId = row._id
      const {expandRowKeys} = this.state
      expandRowKeys.pop()
      expandRowKeys.push(basketId)
      this.setState({expandRowKeys})

      const basket = this.props.basketList.find(v => v._id === basketId)
      if (basket !== undefined && basket.partsCount !== basket.parts.length) {
        console.log('getBasket')
        this.props.getBasket(basketId)
      }
    } else {
      const {expandRowKeys} = this.state
      expandRowKeys.pop()
      this.setState({expandRowKeys})
    }
  }

  private closeTag = (basketId:string, partId:string) => {
    this.props.deleteAPart(partId, basketId);
  }

  private onAddBasket = () => {
    this.props.addBasket();
  }

}

const mapStateToProps = (state :IStoreState) => ({
  basketList: state.basket.basketList,
  defaultBasketId: state.basket.defaultBasketId,
  currentBasket: state.basket.currentBasket,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  addBasket: ()=>dispatch({type:ADD_BASKET}),
  deleteAPart: (partId :string, basketId :string) => dispatch({type:DELETE_PART_FROM_BASKET, data:{partId, basketId}}),
  deleteBasket: (id:string) => dispatch({type:DELETE_BASKET, data: id}),
  getBasket: (basketId:string) => dispatch({type:GET_BASKET, data:basketId}),
  getBasketList:() => dispatch({type:GET_BASKET_LIST}),
  submitDefaultBasketId:(basketId:string) => dispatch({type:SUBMIT_DEFAULT_BASKET_ID, data:basketId}),
  setABasketName:(basketId:string, basketName :string) => dispatch(ActionSetABasketName(basketId, basketName)),
  submitABasketName:(basketId:string, basketName :string) => dispatch({type:SUBMIT_A_BASKET_NAME, data:{basketId, basketName}}),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(BasketList))