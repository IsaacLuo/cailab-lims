export const ADD_BASKET = 'ADD_BASKET';
export const GET_BASKET_LIST = 'GET_BASKET_LIST';
export const DELETE_BASKET = 'DELETE_BASKET';

export const SET_BASKET_LIST = 'SET_BASKET_LIST';
export const SET_DEFAULT_BASKET = 'SET_DEFAULT_BASKET';
export const GET_CURRENT_BASKET = 'GET_CURRENT_BASKET';
export const FILL_PARTS_INTO_BASKET_LIST = 'FILL_PARTS_INTO_BASKET_LIST';

// dispatched when 'basket name' changes when it is edited
export const SET_A_BASKET_NAME = 'SET_A_BASKET_NAME'
export function ActionSetABasketName(basketId:string, basketName :string) {
  return {
    type: SET_A_BASKET_NAME,
    data:{basketId, basketName},
  }
}