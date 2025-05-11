import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CartItem } from "@/lib/types";

export interface CartState {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}

const initialState: CartState = {
  items: [],
  subtotal: 0,
  tax: 0,
  total: 0,
};

// Helper function to calculate cart totals
const calculateTotals = (items: CartItem[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08; // 8% tax rate
  const total = subtotal + tax;
  
  return { subtotal, tax, total };
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // This is the main action we'll use to sync with Redis
    hydrateCart: (state, action: PayloadAction<CartState>) => {
      return {
        ...state,
        items: action.payload.items.map(item => ({
          ...item,
          id: item.id || item.productId, // Ensure id exists for backward compatibility
        })),
        subtotal: action.payload.subtotal,
        tax: action.payload.tax,
        total: action.payload.total,
      };
    },
  },
});

export const {
  hydrateCart,
} = cartSlice.actions;

export default cartSlice.reducer;
