import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Address } from '../components/types';

interface AddressSelectionContextType {
    selectedAddress: Address | undefined;
    setSelectedAddress: (address: Address) => void;
}

const AddressSelectionContext = createContext<AddressSelectionContextType | undefined>(undefined);

export const AddressSelectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [selectedAddress, setSelectedAddress] = useState<Address | undefined>(undefined);

    return (
        <AddressSelectionContext.Provider value={{ selectedAddress, setSelectedAddress }}>
            {children}
        </AddressSelectionContext.Provider>
    );
};

export const useAddressSelection = () => {
    const context = useContext(AddressSelectionContext);
    if (!context) {
        throw new Error('useAddressSelection must be used within an AddressSelectionProvider');
    }
    return context;
};
