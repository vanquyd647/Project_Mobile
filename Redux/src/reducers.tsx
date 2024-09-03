import { ADD_TO_CART, CartActionTypes, Item } from './actions';

interface CartState {
    cart: Item[];
}

const initialState: CartState = {
    cart: [],
};

const cartReducer = (state = initialState, action: CartActionTypes): CartState => {
    switch (action.type) {
        case ADD_TO_CART:
            const existingItemIndex = state.cart.findIndex(item => item.id === action.payload.id);
            if (existingItemIndex >= 0) {
                const updatedCart = state.cart.map((item, index) =>
                    index === existingItemIndex ? { ...item, quantity: (item.quantity || 1) + 1 } : item
                );
                return {
                    ...state,
                    cart: updatedCart,
                };
            } else {
                return {
                    ...state,
                    cart: [...state.cart, { ...action.payload, quantity: 1 }],
                };
            }
        default:
            return state;
    }
};

export default cartReducer;
