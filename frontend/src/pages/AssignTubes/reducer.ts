import { TUBE_RESIGNED } from './actions';
/**
 * @file Assign tubes reducer
 */
import {
  IAction,
  IAssignTubesState,
  IPart,
} from 'types'

import { 
  NEW_BARCODE_ASSIGNED,
  CANCEL_NEW_BARCODE_ASSIGNED,
  SET_BASKET_CONTENT,
} from './actions'

const DEFAULT_STATE:IAssignTubesState = {
  basketContent: []
}

function assignTubesReducer(state :IAssignTubesState = DEFAULT_STATE, action: IAction) {
  switch(action.type){

    // after fetched picklist detail
    case SET_BASKET_CONTENT:
      return {
        ...state,
        basketContent: action.data,
      }

    case NEW_BARCODE_ASSIGNED:
    {
      const part = state.basketContent.find(v=>v._id === action.data.partId);
      if (!part) {
        return state;
      }
      if(part.containers) {
        const existContainer = part.containers.find(v=>v.barcode === action.data.tubeId);
        if (!existContainer) {
          part.containers.push({
            ctype: 'tube',
            barcode: action.data.tubeId,
            assignedAt: new Date(),
            submitStatus: action.data.submitStatus,
          })
        } else if (existContainer.submitStatus !== action.data.submitStatus) {
          existContainer.submitStatus = action.data.submitStatus;
        } else {
          return state;
        }
      } else {
        part.containers = [{
          ctype: 'tube',
          barcode: action.data.tubeId,
          assignedAt: new Date(),
          submitStatus: action.data.submitStatus,
        }];
      }
      return {
        ...state,
        basketContent: [...state.basketContent],
      }
    }
    case CANCEL_NEW_BARCODE_ASSIGNED:
    {
      const part = state.basketContent.find(v=>v._id === action.data.partId);
      if (!part) {
        return state;
      }
      if(part.containers) {
        part.containers = part.containers.filter(v=>v.barcode !== action.data.tubeId);
      }
      return {
        ...state,
        basketContent: [...state.basketContent],
      }
    }
    case TUBE_RESIGNED:
      if(action.data.submitStatus === 'deleting') {
        state.basketContent.forEach(vpart=> {
          if (!vpart.containers) {
            vpart.containers = [];
          }
          const tube = vpart.containers.find(v => {
            if (v.ctype === 'tube' && v.barcode === action.data.tubeId) {
              v.submitStatus = 'deleting';
              return true;
            } else {
              return false;
            }
          });
        });
      } else {
        state.basketContent = state.basketContent.map(vpart=> {
          if (vpart.containers) {
            vpart.containers = vpart.containers.filter(v => !(v.ctype === 'tube' && v.barcode === action.data.tubeId));
          }
          return vpart;
        });
      }
      return {
        ...state,
      }
    default:
      return state;
  }
}

export default assignTubesReducer;