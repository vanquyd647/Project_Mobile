import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { getFirestore, collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

interface Address {
    id: string;
    name: string;
    address: string;
    phone: string;
    addressType: string;
    isDefault: boolean;
}

interface AddressState {
    addresses: Address[];
    loading: boolean;
    error: string | null;
}

const initialState: AddressState = {
    addresses: [],
    loading: false,
    error: null,
};

// Async thunk to fetch addresses
export const fetchAddresses = createAsyncThunk('address/fetchAddresses', async (_, { rejectWithValue }) => {
    const auth = getAuth();
    const db = getFirestore();
    const user = auth.currentUser;

    if (!user) return rejectWithValue("User is not authenticated");

    try {
        const addresses: Address[] = [];
        const addressesRef = collection(db, 'users', user.uid, 'addresses');
        
        return new Promise<Address[]>((resolve, reject) => {
            const unsubscribe = onSnapshot(addressesRef, (querySnapshot) => {
                const list: Address[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    console.log("Document Data:", data);  // Kiểm tra dữ liệu document
                    const { name, address, phone, addressType, isDefault } = data;
                    list.push({
                        id: doc.id,
                        name,
                        address,
                        phone,
                        addressType,
                        isDefault,
                    });
                });
                console.log("Fetched Addresses:", list);  // Kiểm tra danh sách địa chỉ sau khi fetch
                resolve(list);
            }, (error) => reject(error));
        });
    } catch (error) {
        return rejectWithValue("Failed to fetch addresses: " + (error as Error).message);
    }
});



// Async thunk to add/update address
export const saveAddress = createAsyncThunk(
    'address/saveAddress',
    async ({ address, isEdit }: { address: Omit<Address, 'id'> & { id?: string }; isEdit: boolean }, { rejectWithValue }) => {
        const auth = getAuth();
        const db = getFirestore();
        const user = auth.currentUser;

        if (!user) return rejectWithValue("User is not authenticated");

        try {
            if (isEdit && address.id) {
                const addressRef = doc(db, 'users', user.uid, 'addresses', address.id);
                await updateDoc(addressRef, address);
                return { id: address.id, ...address };
            } else {
                const { id, ...addressWithoutId } = address;
                const addressesRef = collection(doc(db, 'users', user.uid), 'addresses');
                const docRef = await addDoc(addressesRef, addressWithoutId);
                return { id: docRef.id, ...addressWithoutId };
            }
        } catch (error) {
            return rejectWithValue("Failed to save address: " + (error as Error).message);
        }
    }
);

// Async thunk to delete address
export const deleteAddress = createAsyncThunk('address/deleteAddress', async (id: string, { rejectWithValue }) => {
    const auth = getAuth();
    const db = getFirestore();
    const user = auth.currentUser;

    if (!user) return rejectWithValue("User is not authenticated");

    try {
        const addressRef = doc(db, 'users', user.uid, 'addresses', id);
        await deleteDoc(addressRef);
        return id;
    } catch (error) {
        return rejectWithValue("Failed to delete address: " + (error as Error).message);
    }
});

const addressSlice = createSlice({
    name: 'address',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAddresses.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAddresses.fulfilled, (state, action: PayloadAction<Address[]>) => {
                state.addresses = action.payload;
                state.loading = false;
            })
            .addCase(fetchAddresses.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(saveAddress.fulfilled, (state, action: PayloadAction<Address>) => {
                const index = state.addresses.findIndex(addr => addr.id === action.payload.id);
                if (index >= 0) {
                    state.addresses[index] = action.payload;
                } else {
                    state.addresses.push(action.payload);
                }
                state.loading = false;
            })
            .addCase(saveAddress.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(deleteAddress.fulfilled, (state, action: PayloadAction<string>) => {
                state.addresses = state.addresses.filter(addr => addr.id !== action.payload);
                state.loading = false;
            })
            .addCase(deleteAddress.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default addressSlice.reducer;
export const selectAddresses = (state: { address: AddressState }) => state.address.addresses;
