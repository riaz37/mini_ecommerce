import { configureStore } from '@reduxjs/toolkit';
import cartReducer, { CartState, hydrateCart } from './cartSlice';

// Create the Redux store
export const store = configureStore({
  reducer: {
    cart: cartReducer,
  },
});

// Load cart from localStorage
if (typeof window !== 'undefined') {
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    try {
      const parsedCart = JSON.parse(savedCart) as CartState;
      store.dispatch(hydrateCart(parsedCart));
    } catch (error) {
      console.error('Failed to parse cart from localStorage:', error);
    }
  }

  // Save cart to localStorage when it changes
  store.subscribe(() => {
    const state = store.getState();
    localStorage.setItem('cart', JSON.stringify(state.cart));
  });
}

// Define RootState and AppDispatch types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;