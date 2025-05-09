import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '@/lib/types';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  id: string;
}

export interface CartState {
  items: CartItem[];
  total: number;
}

const initialState: CartState = {
  items: [],
  total: 0,
};

// Helper function to calculate total
const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<{ product: Product; quantity: number }>) => {
      const { product, quantity } = action.payload;
      const existingItemIndex = state.items.findIndex(
        (item) => item.productId === product.id
      );

      if (existingItemIndex >= 0) {
        // Update quantity if item already exists
        state.items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item
        state.items.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity,
          id: product.id,
        });
      }
      
      // Update total
      state.total = calculateTotal(state.items);
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.productId !== action.payload);
      state.total = calculateTotal(state.items);
    },
    updateQuantity: (state, action: PayloadAction<{ productId: string; quantity: number }>) => {
      const { productId, quantity } = action.payload;
      
      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        state.items = state.items.filter(item => item.productId !== productId);
      } else {
        // Update quantity
        const itemIndex = state.items.findIndex(item => item.productId === productId);
        if (itemIndex >= 0) {
          state.items[itemIndex].quantity = quantity;
        }
      }
      
      // Update total
      state.total = calculateTotal(state.items);
    },
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
    },
    hydrateCart: (state, action: PayloadAction<CartState>) => {
      return action.payload;
    },
  },
});

export const { addItem, removeItem, updateQuantity, clearCart, hydrateCart } = cartSlice.actions;

export default cartSlice.reducer;