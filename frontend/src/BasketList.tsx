import * as React from 'react'
// react-router-redux
import { IStoreState } from './store';
import { withRouter, Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import {
  ActionSetABasketName,
} from './actions'

import {Button, Radio, Table, Input, Notification} from 'element-react'
import styled from 'styled-components'

export interface IProps {
  basketList:any[],
  getBasketList: ()=>void,
  submitDefaultBasket:(basketId :string)=>void,
  defaultBasket:string,
  setABasketName:(basketId:string, basketName :string) => void,
  submitABasketName:(basketId:string, basketName :string) => void,
}

interface IState {
  ifEdit: boolean[],
  inputRef: any,
}

class BasketList extends React.Component<IProps, IState> {
  constructor(props :IProps) {
    super(props);
    this.state = {
      ifEdit:this.props.basketList.map(v=>false), 
      inputRef: undefined,
    }
  }

  public componentDidMount () {
    this.props.getBasketList();
  }

  public componentWillReceiveProps(newProps:IProps) {
    if (newProps.basketList.length !== this.props.basketList.length) {
      this.setState({ifEdit: newProps.basketList.map(v=>false)})
      console.log('hahaha')
    }
  }

  public render() {
    const {basketList} = {...this.props}
    const length:number = basketList? basketList.length: 0
    const expr:string = length > 1? 'baskets':'basket'

    const tableColumns = [
      {label:'Basket Name', prop:'name', 
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
      {label:'Parts Count', prop:'partsCount'},
      {label:'Created At', prop:'createdAt'},
      {label:'Select Default', prop:'default', 
        render:(row)=>{
          return (
            <div>
              <Radio checked={row._id === this.props.defaultBasket} value='' name='defaultBastket' 
              onChange={this.changeRadio.bind(this,row._id)}/>
            </div>
          )
        }
      },
      {label:'Operation', prop:'name',
        render:()=>{
          return (
            <span>
              <Button type="danger" size="small">delete</Button>
            </span>)
        }
      }
    ]

    return (
      <div>
        <p>you have {length} {expr}.</p>
        
        <Button>Add Basket</Button>

        {length > 0 && 
          <Table 
            style={{margin:'auto'}}
            columns = {tableColumns}
            data = {this.props.basketList}
          /> }
      </div>
    );
  }

  private changeRadio = (id:string)=>{
    this.props.submitDefaultBasket(id);
  }

  private editBasketName = (index: number) => {
    const newIfEdit = this.state.ifEdit.slice()
    newIfEdit[index] = true
    this.setState({ifEdit:newIfEdit})
  }

  private blurBasketName = (basketId:string, index:number, e:any) =>{
    console.log(e.target.value)
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
}

const mapStateToProps = (state :IStoreState) => ({
  basketList: state.basketList,
  defaultBasket: state.defaultBasket,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  getBasketList:() => dispatch({type:'GET_BASKET_LIST'}),
  submitDefaultBasket:(basketId:string) => dispatch({type:'SUBMIT_DEFAULT_BASKET', data:basketId}),
  setABasketName:(basketId:string, basketName :string) => dispatch(ActionSetABasketName(basketId, basketName)),
  submitABasketName:(basketId:string, basketName :string) => dispatch({type:'SUBMIT_A_BASKET_NAME', data:{basketId, basketName}}),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(BasketList))