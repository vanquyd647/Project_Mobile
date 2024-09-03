import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { collection, doc, getDocs, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../config/firebaseConfig'; 
import { AppDispatch } from './store';

const auth = getAuth();

interface CartItem {
    product_id: string;
    product_name: string;
    price: number;
    quantity: number;
    quantity_pur: number;
    image: string;
}



interface CartState {
    items: CartItem[];
}

const initialState: CartState = {
    items: [],
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        setCartItems(state, action: PayloadAction<CartItem[]>) {
            state.items = action.payload;
        },
        addToCart(state, action: PayloadAction<CartItem>) {
            const existingItem = state.items.find(item => item.product_id === action.payload.product_id);
            if (existingItem) {
                existingItem.quantity_pur += action.payload.quantity_pur;
            } else {
                state.items.push(action.payload);
            }
        },
        removeFromCart(state, action: PayloadAction<string>) {
            state.items = state.items.filter(item => item.product_id !== action.payload);
        },
    },
});

export const { setCartItems, addToCart, removeFromCart } = cartSlice.actions;

export const loadCartFromFirebase = () => async (dispatch: AppDispatch) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const cartRef = collection(doc(db, 'users', userId), 'cart');
    const snapshot = await getDocs(cartRef);

    const cartItems: CartItem[] = snapshot.docs.map(doc => doc.data() as CartItem);
    dispatch(setCartItems(cartItems));
};

export const saveCartToFirebase = (cartItems: CartItem[]) => async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const cartRef = collection(doc(db, 'users', userId), 'cart');
    const batch = writeBatch(db);

    // Clear existing items
    const existingItems = await getDocs(cartRef);
    existingItems.docs.forEach(doc => batch.delete(doc.ref));

    // Add new items
    cartItems.forEach(item => {
        const itemRef = doc(cartRef, item.product_id);
        batch.set(itemRef, item);
    });

    await batch.commit();
};

export default cartSlice.reducer;
