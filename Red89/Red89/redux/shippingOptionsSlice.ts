import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

interface ShippingOption {
    id: string;
    ship_id: number;
    name: string;
    price: number;
    deliveryTime: string;
}

interface ShippingOptionsState {
    options: ShippingOption[];
    loading: boolean;
    error: string | null;
}

const initialState: ShippingOptionsState = {
    options: [],
    loading: false,
    error: null,
};

// Async thunk to fetch shipping options from Firestore
export const fetchShippingOptions = createAsyncThunk(
    'shippingOptions/fetchShippingOptions',
    async (_, { rejectWithValue }) => {
        try {
            const db = getFirestore();
            const shippingOptionsCollection = collection(db, 'shippingOptions');
            const querySnapshot = await getDocs(shippingOptionsCollection);
            const shippingOptions: ShippingOption[] = [];
            querySnapshot.forEach((doc) => {
                shippingOptions.push({
                    id: doc.id,
                    ...doc.data(),
                } as ShippingOption);
            });

            shippingOptions.sort((a, b) => a.ship_id - b.ship_id);
            return shippingOptions;
            
        } catch (error: unknown) {
            return rejectWithValue((error as Error).message);
        }
    }
);


const shippingOptionsSlice = createSlice({
    name: 'shippingOptions',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchShippingOptions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchShippingOptions.fulfilled, (state, action) => {
                state.loading = false;
                state.options = action.payload;
            })
            .addCase(fetchShippingOptions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default shippingOptionsSlice.reducer;
