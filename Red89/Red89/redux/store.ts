import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import addressSlice from './addressSlice';
import shippingOptionsReducer from './shippingOptionsSlice';

export const store = configureStore({
    reducer: {
        cart: cartReducer,
        address: addressSlice,
        shippingOptions: shippingOptionsReducer,
        
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
