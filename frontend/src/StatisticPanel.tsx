

import * as React from 'react'

// react-router-redux
import { IStoreState } from './store';
import { withRouter, Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import {
} from './actions'
import ErrorBoundary from 'ErrorBoundary';
import Axios from 'axios';
import { serverURL } from 'config';
import getAuthHeader from 'authHeader';

import {Notification, Loading} from 'element-react'

export interface IProps {
}

export interface IState {
	loading: boolean,
	count: {bacteria:number,primers:number,yeasts:number},
	monthlyStatistic: Array<{_id:string, count:number}>,
}

class StatisticPanel extends React.Component<IProps, IState> {
  constructor(props :IProps) {
    super(props);
    this.state = {
			loading: true,
			count: {bacteria:0,primers:0,yeasts:0},
			monthlyStatistic: [],
		};
		
		this.fetchStastic();
  }

  public render() {
    return <ErrorBoundary>
			<Loading loading={this.state.loading}>
			<div>bacteria: {this.state.count.bacteria}</div>
			<div>primers: {this.state.count.primers}</div>
			<div>yeast: {this.state.count.yeasts}</div>
			<div>{JSON.stringify(this.state.monthlyStatistic)}</div>
			</Loading>
    </ErrorBoundary>
  }

  private fetchStastic = async () => {
    try {
			const response = await Axios.get(`${serverURL}/api/statistic`, getAuthHeader());
			this.setState({...response.data, loading: false});
		} catch (err) {
			Notification.error(`error: ${err}`)
		}
  }
}

const mapStateToProps = (state :IStoreState) => ({
  redirect: state.redirect,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  clear: () => dispatch({type:'clearRedirect'}),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(StatisticPanel))