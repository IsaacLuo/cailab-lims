
// types..
import { IStoreState } from '../../types';

// react
import * as React from 'react'

// react-router-redux
import { withRouter, Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

// tools
import Axios from 'axios';
import { serverURL } from '../../config';
import getAuthHeader from '../../authHeader';
import {Notification} from 'element-react'

// components
import ErrorBoundary from '../ErrorBoundary';

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

		const {monthlyStatistic} = this.state;

		const svgWidth = 800;
		const svgHeight = 800;
		const barBottom = svgHeight - 50;
		const xStep = (svgWidth-50)/monthlyStatistic.length;
		let x = -xStep;
		const rects = monthlyStatistic.map(item => {
			const height = item.count;
			x+=xStep;
			return <g key={item._id}>
				<text
					x={x+xStep/2}
					y={barBottom-height - 2}
					textAnchor='middle'
				>{item.count}</text>
				<rect
					x={x}
					y={barBottom-height}
					width={xStep-5}
					height={height}
					fill="#6495ED"
					/>
				<text
					x={x+10}
					y={barBottom}
					alignmentBaseline='before-edge'
					transform={`rotate(30, ${x}, ${barBottom})`}
				>{item._id}</text>
				</g>
		});

    return <ErrorBoundary>
			{this.state.loading ? <div>loading</div> : <div style={{background:'#fafafa'}}>
			<div><Link to="/parts/bacteria">bacteria: {this.state.count.bacteria}</Link></div>
			<div><Link to="/parts/primers">primers: {this.state.count.primers}</Link></div>
			<div><Link to="/parts/yeasts">yeast: {this.state.count.yeasts}</Link></div>
			<div>
				
				<svg width={svgWidth} height={svgHeight}>
					{rects}
				</svg>
				<div>parts created in last 12 months</div>
			</div>
			</div>
			}
			
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
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  clear: () => dispatch({type:'clearRedirect'}),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(StatisticPanel))