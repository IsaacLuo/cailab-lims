import {combineReducers} from 'redux';
import appReducer from './appReducer';
import userReducer from './userReducer';
import basketReducer from 'pages/BasketList/reducer'
import partListReducer from 'pages/PartList/reducer'
import assignTubesReducer from 'pages/AssignTubes/reducer';
import searchTubeBarcodeReducer from 'pages/SearchTubeBarcode/reducer';
import searchRackBarcodeReducer from 'pages/SearchRackBarcode/reducer';
import partReducer from 'pages/Part/reducer';

export default combineReducers({
  app: appReducer,
  user: userReducer,
  basket: basketReducer,
  partList: partListReducer,
  assignTubes: assignTubesReducer,
  searchTubeBarcode: searchTubeBarcodeReducer,
  searchRackBarcode: searchRackBarcodeReducer,
  part: partReducer,
});