import { createStore } from 'redux';
import cartReducer from '../src/reducers';

const store = createStore(cartReducer);

export default store;
