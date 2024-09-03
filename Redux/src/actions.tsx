export const ADD_TO_CART = 'ADD_TO_CART';

export interface Item {
    id: number;
    name: string;
    quantity?: number;
}

export interface AddToCartAction {
    type: typeof ADD_TO_CART;
    payload: Item;
}

export type CartActionTypes = AddToCartAction;

export const addToCart = (item: Item): AddToCartAction => ({
    type: ADD_TO_CART,
    payload: item,
});

export type UnknownAction = { type: string; payload?: any };