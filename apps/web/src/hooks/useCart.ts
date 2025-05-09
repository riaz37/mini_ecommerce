"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { Product } from "@/lib/types";
import { 
  addItem as addToCartAction,
  removeItem as removeItemAction,
  updateQuantity as updateQuantityAction,
  clearCart as clearCartAction,
  hydrateCart
} from "@/store/cartSlice";
import { 
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart as clearCartApi
} from "@/lib/api/cart";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { RootState } from "@/store/store";

// Generate a session ID for guest users
const getSessionId = () => {
  if (typeof window === "undefined") return "";

  let sessionId = localStorage.getItem("cart_session_id");
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem("cart_session_id", sessionId);
  }
  return sessionId;
};

export function useCart() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const cartTotal = useSelector((state: RootState) => state.cart.total);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const sessionId = getSessionId();

  // Fetch cart from server on initial load
  useEffect(() => {
    const fetchCart = async () => {
      if (!sessionId) return;
      
      setIsLoading(true);
      try {
        const serverCart = await getCart(sessionId);
        
        // Update Redux store with server cart
        dispatch(hydrateCart({
          sessionId,
          items: serverCart.items.map(item => ({
            id: item.productId,
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          total: serverCart.total
        }));
      } catch (err) {
        console.error("Failed to fetch cart:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCart();
  }, [dispatch, sessionId, user?.id]);

  const addItem = async (product: Product, quantity: number) => {
    setIsLoading(true);
    setError(null);

    try {
      // Add to server-side cart
      await addToCart(sessionId, product.id, quantity);

      // Update local Redux store
      dispatch(
        addToCartAction({
          product,
          quantity,
        })
      );
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to add item to cart")
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (productId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Remove from server-side cart
      await removeCartItem(sessionId, productId);

      // Update local Redux store
      dispatch(removeItemAction(productId));
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to remove item from cart")
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    setIsLoading(true);
    setError(null);

    try {
      // Update server-side cart
      await updateCartItem(sessionId, productId, quantity);

      // Update local Redux store
      dispatch(updateQuantityAction({ productId, quantity }));
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to update cart item")
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Clear server-side cart
      await clearCartApi(sessionId);

      // Update local Redux store
      dispatch(clearCartAction());
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to clear cart")
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const checkout = async (customerId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const order = await apiClient("/checkout", {
        method: "POST",
        body: {
          sessionId,
          customerId,
        },
        requireAuth: true,
      });

      // Clear cart after successful checkout
      dispatch(clearCartAction());

      return order;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Checkout failed"));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    cart: { items: cartItems, total: cartTotal },
    items: cartItems,
    total: cartTotal,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    checkout,
    isLoading,
    error,
  };
}
