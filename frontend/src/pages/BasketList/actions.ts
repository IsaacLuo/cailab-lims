export const ADD_BASKET = 'ADD_BASKET';
export const GET_BASKET_LIST = 'GET_BASKET_LIST';
export const DELETE_BASKET = 'DELETE_BASKET';

export const SET_BASKET_LIST = 'SET_BASKET_LIST';
export const SET_DEFAULT_BASKET_ID = 'SET_DEFAULT_BASKET_ID';
export const GET_BASKET = 'GET_BASKET';
export const FILL_PARTS_INTO_BASKET_LIST = 'FILL_PARTS_INTO_BASKET_LIST';
export const DELETE_PART_FROM_BASKET = 'DELETE_PART_FROM_BASKET';

export const SET_CURRENT_BASKET = 'SET_CURRENT_BASKET';
export const SUBMIT_DEFAULT_BASKET_ID = 'SUBMIT_DEFAULT_BASKET_ID';
export const SUBMIT_A_BASKET_NAME = 'SUBMIT_A_BASKET_NAME';
export const CLEAR_BASKET = 'CLEAR_BASKET';

export const SET_CURRENT_BASKET_ID = 'SET_CURRENT_BASKET_ID';


// dispatched when 'basket name' changes when it is edited
export const SET_A_BASKET_NAME = 'SET_A_BASKET_NAME'
export function ActionSetABasketName(basketId:string, basketName :string) {
  return {
    type: SET_A_BASKET_NAME,
    data:{basketId, basketName},
  }
}