import {combineReducers} from 'redux';
import appReducer from './appReducer';
import userReducer from './userReducer';
import basketReducer from 'pages/BasketList/reducer'
import partListReducer from 'pages/PartsList/reducer'
import assignTubesReducer from 'pages/AssignTubes/reducer';
import searchTubeBarcodeReducer from 'pages/SearchTubeBarcode/reducer';

export default combineReducers({
  app: appReducer,
  user: userReducer,
  basket: basketReducer,
  partList: partListReducer,
  assignTubes: assignTubesReducer,
  searchTubeBarcode: searchTubeBarcodeReducer,
});