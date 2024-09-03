import React from 'react';
import { Provider } from 'react-redux';
import store from '../src/store';
import ProductList from '../src/ProductList';
import Cart from '../src/Cart';

const App = () => {
  return (
    <Provider store={store}>
      <ProductList />
      <Cart />
    </Provider>
  );
};

export default App;
