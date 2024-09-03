import { Image } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
    Home: undefined;
    ProductDetailsScreen: { product: ProductType };
    Clothes: undefined;
    Footwear: undefined;
    Backpack: undefined;
    Accessory: undefined;
    Watch: undefined;
    Cosmetics: undefined;
    ShoppingCart: undefined;
    SettingScreen: undefined;
    OdersScreen: undefined;
    CheckoutScreen: {
        products?: Array<{
            image: string;
            product_id: string;
            product_name: string;
            price: number;
            quantity_pur: number;
        }>;
    };
    Add_addressScreen: { addressData?: Address };
    AddressBookScreen: undefined;
};


export type Address = {
    id: string;
    name: string;
    address: string;
    phone: string;
    addressType: string;
    isDefault: boolean;
};

export type ProductType = {
    product_name: string;
    price: number;
    image: string;
    sale: number;
    quantity: number;
    sold: number;
    star: number;
    category: string[];
    type: string[];
    product_id: string;
};

export type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;
export type ProductDetailsScreenRouteProp = RouteProp<RootStackParamList, 'ProductDetailsScreen'>;
export type ProductDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProductDetailsScreen'>;
export type AddressBookScreenRouteProp = RouteProp<RootStackParamList, 'AddressBookScreen'>;
