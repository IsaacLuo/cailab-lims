/**
 * @file Toeken QR code for mobile login
 */

import * as React from 'react'
import QRCode from 'qrcode'
import { IStoreState } from 'types';

// react-router-redux
import { withRouter, Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { QUERY_MY_USER_BARCODE } from './actions';

interface IProps {
  barcode: string,
  queryUserBarcode:()=>void,
}

interface IState {
  qrCode: string,
}

class TokenBarcode extends React.Component<IProps, IState> {

  constructor(props:IProps) {
    super(props);
    this.state = {
      qrCode: '',
    }
    this.generateQR(props.barcode).then(qrCode => this.setState({qrCode}));
    this.props.queryUserBarcode();
  }

  public componentWillReceiveProps(props:IProps) {
    this.generateQR(props.barcode).then(qrCode => this.setState({qrCode}));
  }

  public render() {
    return <div>
      <img src={this.state.qrCode}/>
    </div>
  }

  private generateQR = async text => {
    try {
      return await QRCode.toDataURL(text);
    } catch (err) {
      console.error('unable to generate qr code', err.message);
      return '';
    }
  }
}

const mapStateToProps = (state :IStoreState) => ({
  barcode: state.user.barcode,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  queryUserBarcode: ()=>dispatch({type:QUERY_MY_USER_BARCODE}),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(TokenBarcode))