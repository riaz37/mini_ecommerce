"use client";

import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Product } from "@/lib/types";
import { hydrateCart } from "@/store/cartSlice";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart as clearCartApi,
  createCartSession,
} from "@/lib/api/cart";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { RootState } from "@/store/store";

export function useCart() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const cartState = useSelector((state: RootState) => state.cart);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mergedRef = useRef(false);

  // Helper function to standardize cart item mapping
  const mapCartItems = (serverCart) => {
    return serverCart.items.map((item) => ({
      id: item.productId,
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      ...(item.image && { image: item.image }),
    }));
  };

  // Helper function to update Redux store with server cart
  const updateReduxCart = (serverCart) => {
    dispatch(
      hydrateCart({
        items: mapCartItems(serverCart),
        subtotal: serverCart.subtotal || 0,
        tax: serverCart.tax || 0,
        total: serverCart.total || 0,
      })
    );
  };

  // Initialize session if needed
  useEffect(() => {
    const initializeSession = async () => {
      // Check if we have a session cookie already
      // We don't need to check the value, the backend will do that
      if (!document.cookie.includes('cart_session_id')) {
        setIsLoading(true);
        try {
          await createCartSession();
          console.log("Created new cart session");
        } catch (err) {
          console.error("Failed to create cart session:", err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    initializeSession();
  }, []);

  // Fetch cart from Redis on initial load and when user auth changes
  useEffect(() => {
    const fetchCart = async () => {
      setIsLoading(true);
      try {
        // Ensure we have a session before fetching cart
        if (!document.cookie.includes('cart_session_id')) {
          await createCartSession();
        }
        
        const serverCart = await getCart();
        updateReduxCart(serverCart);
      } catch (err) {
        console.error("Failed to fetch cart from Redis:", err);
        // Don't set error state here to avoid showing error to user
      } finally {
        setIsLoading(false);
      }
    };

    fetchCart();
    
    // Add a small delay to ensure auth state is fully updated
    const refreshTimeout = setTimeout(() => {
      if (user?.id) fetchCart();
    }, 500);
    
    return () => clearTimeout(refreshTimeout);
  }, [dispatch, user?.id]);

  // When user logs in, merge their guest cart with their user cart
  useEffect(() => {
    const mergeCartsAfterLogin = async () => {
      if (user?.id && !mergedRef.current) {
        try {
          setIsLoading(true);
          await apiClient("/cart/merge", {
            method: "POST",
            requireAuth: true
          });
          
          mergedRef.current = true; // Mark as merged
          
          const mergedCart = await getCart();
          updateReduxCart(mergedCart);
          console.log("Cart merge successful");
        } catch (err) {
          console.error("Failed to merge carts:", err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    mergeCartsAfterLogin();
  }, [user?.id, dispatch]);

  const handleApiError = (error: any, defaultMessage: string) => {
    // Extract error message from API response if available
    let errorMessage = defaultMessage;
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.error(errorMessage, error);
    setError(new Error(errorMessage));
    return errorMessage;
  };

  const addItem = async (product: Product, quantity: number) => {
    setIsLoading(true);
    setError(null);

    try {
      // No need to check for sessionId, the cookie will be sent automatically
      const updatedCart = await addToCart(product.id, quantity);
      updateReduxCart(updatedCart);
      return updatedCart;
    } catch (error) {
      handleApiError(error, "Failed to add item to cart");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateItem = async (productId: string, quantity: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedCart = await updateCartItem(productId, quantity);
      updateReduxCart(updatedCart);
      return updatedCart;
    } catch (error) {
      handleApiError(error, "Failed to update cart item");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (productId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedCart = await removeCartItem(productId);
      updateReduxCart(updatedCart);
      return updatedCart;
    } catch (error) {
      handleApiError(error, "Failed to remove item from cart");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await clearCartApi();
      dispatch(
        hydrateCart({
          items: [],
          subtotal: 0,
          tax: 0,
          total: 0,
        })
      );
    } catch (error) {
      handleApiError(error, "Failed to clear cart");
    } finally {
      setIsLoading(false);
    }
  };

  const checkout = async (shippingAddress, paymentMethod) => {
    setIsLoading(true);
    setError(null);

    try {
      const checkoutData = {
        ...(user?.id && { customerId: user.id }),
        shippingAddress,
        paymentMethod
      };

      const response = await apiClient("/checkout", {
        method: "POST",
        body: checkoutData,
        requireAuth: !!user?.id,
      });

      if (response.url) {
        window.location.href = response.url;
        return null;
      }

      await clearCart();
      return response;
    } catch (error) {
      handleApiError(error, "Checkout failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    cart: {
      items: cartState.items,
      subtotal: cartState.subtotal,
      tax: cartState.tax,
      total: cartState.total,
    },
    isLoading,
    error,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    checkout,
  };
}
