import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Product } from "@/lib/types";

export interface CartItem {
  productId: string;
  id: string; // Same as productId for compatibility
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CartState {
  sessionId: string;
  items: CartItem[];
  total: number;
}

// Initialize with empty values - we'll load from Redis
const initialState: CartState = {
  sessionId: "",
  items: [],
  total: 0,
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // Set the session ID
    setSessionId: (state, action: PayloadAction<string>) => {
      state.sessionId = action.payload;
    },

    // These actions now just update the local state
    // The actual persistence happens in Redis
    addItem: (
      state,
      action: PayloadAction<{ product: Product; quantity: number }>,
    ) => {
      const { product, quantity } = action.payload;
      const existingItemIndex = state.items.findIndex(
        (item) => item.productId === product.id,
      );

      if (existingItemIndex >= 0) {
        state.items[existingItemIndex].quantity += quantity;
      } else {
        state.items.push({
          productId: product.id,
          id: product.id, // Keep both the same
          name: product.name,
          price: product.price,
          quantity,
          image: product.images?.[0],
        });
      }

      // Update total
      state.total = state.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
    },

    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(
        (item) => item.productId !== action.payload,
      );
      state.total = state.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
    },

    updateQuantity: (
      state,
      action: PayloadAction<{ productId: string; quantity: number }>,
    ) => {
      const { productId, quantity } = action.payload;

      if (quantity <= 0) {
        state.items = state.items.filter(
          (item) => item.productId !== productId,
        );
      } else {
        const itemIndex = state.items.findIndex(
          (item) => item.productId === productId,
        );
        if (itemIndex >= 0) {
          state.items[itemIndex].quantity = quantity;
        }
      }

      state.total = state.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
    },

    clearCart: (state) => {
      state.items = [];
      state.total = 0;
    },

    // This is the main action we'll use to sync with Redis
    hydrateCart: (state, action: PayloadAction<CartState>) => {
      return {
        ...state,
        items: action.payload.items,
        total: action.payload.total,
        // Keep the existing sessionId unless one is provided
        sessionId: action.payload.sessionId || state.sessionId,
      };
    },
  },
});

export const {
  setSessionId,
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  hydrateCart,
} = cartSlice.actions;

export default cartSlice.reducer;
