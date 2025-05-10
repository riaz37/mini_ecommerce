"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Product } from "@/lib/types";
import {
  addItem as addToCartAction,
  removeItem as removeItemAction,
  updateQuantity as updateQuantityAction,
  clearCart as clearCartAction,
  hydrateCart,
  setSessionId,
} from "@/store/cartSlice";
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
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const cartTotal = useSelector((state: RootState) => state.cart.total);
  const sessionId = useSelector((state: RootState) => state.cart.sessionId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize session ID if needed
  useEffect(() => {
    const initializeSession = async () => {
      if (!sessionId) {
        setIsLoading(true);
        try {
          // Create a new session on the server
          const response = await createCartSession();
          dispatch(setSessionId(response.sessionId));
        } catch (err) {
          console.error("Failed to create cart session:", err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    initializeSession();
  }, [sessionId, dispatch]);

  // Fetch cart from Redis on initial load and when session ID changes
  useEffect(() => {
    const fetchCart = async () => {
      setIsLoading(true);
      try {
        // Don't depend on sessionId for fetching when user is logged in
        const serverCart = await getCart();
        
        // Update Redux store with server cart from Redis
        dispatch(
          hydrateCart({
            sessionId,
            items: serverCart.items.map((item) => ({
              id: item.productId,
              productId: item.productId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              ...(item.image && { image: item.image }),
            })),
            total: serverCart.total,
          })
        );
      } catch (err) {
        console.error("Failed to fetch cart from Redis:", err);
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
  }, [dispatch, sessionId, user?.id]);

  // When user logs in, we might want to merge their guest cart with their user cart
  useEffect(() => {
    const mergeCartsAfterLogin = async () => {
      // Only attempt to merge carts if user is logged in and we have a session ID
      if (user?.id && sessionId) {
        try {
          setIsLoading(true);

          // Get auth token
          const authToken = localStorage.getItem("auth_token");

          if (!authToken) {
            console.log(
              "No auth token found in localStorage, checking cookies..."
            );

            // Try to get from cookies
            const cookies = document.cookie.split(";");
            const tokenCookie = cookies.find((c) =>
              c.trim().startsWith("auth_token=")
            );

            if (!tokenCookie) {
              console.log(
                "No auth token found in cookies either, skipping cart merge"
              );
              return;
            }
          }

          console.log("Auth token found, attempting to merge carts");

          // Call API to merge carts in Redis
          await apiClient("/cart/merge", {
            method: "POST",
            body: { sessionId },
            requireAuth: true,
          });

          // Fetch the merged cart
          const mergedCart = await getCart(sessionId);

          // Update Redux with the merged cart
          dispatch(
            hydrateCart({
              sessionId,
              items: mergedCart.items.map((item) => ({
                id: item.productId,
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                ...(item.image && { image: item.image }),
              })),
              total: mergedCart.total,
            })
          );

          console.log("Cart merge successful");
        } catch (err) {
          console.error("Failed to merge carts:", err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    mergeCartsAfterLogin();
  }, [user?.id, sessionId, dispatch]);

  const addItem = async (product: Product, quantity: number) => {
    setIsLoading(true);
    setError(null);

    try {
      // Make sure we have a session ID
      if (!sessionId) {
        // Wait for session initialization
        const response = await createCartSession();
        dispatch(setSessionId(response.sessionId));
      }

      // Use the addToCart function from your API client
      const updatedCart = await addToCart(product.id, quantity);

      // Update Redux store with the response from the server
      dispatch(
        hydrateCart({
          sessionId,
          items: updatedCart.items.map((item) => ({
            id: item.productId, // Keep this for backward compatibility
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            // Add image if available
            ...(item.image && { image: item.image }),
          })),
          total: updatedCart.total,
        })
      );

      return updatedCart;
    } catch (error) {
      console.error("Error adding to cart:", error);
      setError(
        error instanceof Error ? error : new Error("Failed to add item to cart")
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (productId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Remove from Redis cart - no need to pass sessionId
      const updatedCart = await removeCartItem(productId);

      // Update Redux store with the response from Redis
      dispatch(
        hydrateCart({
          sessionId,
          items: updatedCart.items.map((item) => ({
            id: item.productId, // Keep this for backward compatibility
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            // Add image if available
            ...(item.image && { image: item.image }),
          })),
          total: updatedCart.total,
        })
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to remove item from cart")
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
      // Update Redis cart - no need to pass sessionId
      const updatedCart = await updateCartItem(productId, quantity);

      // Update Redux store with the response from Redis
      dispatch(
        hydrateCart({
          sessionId,
          items: updatedCart.items.map((item) => ({
            id: item.productId, // Keep this for backward compatibility
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            // Add image if available
            ...(item.image && { image: item.image }),
          })),
          total: updatedCart.total,
        })
      );
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
      // Clear Redis cart - no need to pass sessionId
      await clearCartApi();

      // Update Redux store
      dispatch(clearCartAction());
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to clear cart"));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const checkout = async (shippingAddress, paymentMethod) => {
    setIsLoading(true);
    setError(null);

    try {
      // For guest checkout, we just need sessionId
      // For logged-in users, we'll use their user ID
      const checkoutData = {
        sessionId,
        ...(user?.id && { customerId: user.id }),
        shippingAddress,
        paymentMethod
      };

      // Create Stripe checkout session
      const response = await apiClient("/checkout", {
        method: "POST",
        body: checkoutData,
        requireAuth: !!user?.id, // Require auth only for logged-in users
      });

      // If we have a Stripe checkout URL, redirect to it
      if (response.url) {
        window.location.href = response.url;
        return null; // Return null as we're redirecting
      }

      // Clear cart after successful checkout if no redirect
      await clearCart();

      return response;
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
