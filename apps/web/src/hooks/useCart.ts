
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
  mergeCart,
} from "@/lib/api/cart";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { RootState } from "@/store/store";

// Add a static flag to track merge status across component instances
let globalMergeStatus = {
  inProgress: false,
  completed: false,
};

export function useCart() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const cartState = useSelector((state: RootState) => state.cart);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mergedRef = useRef(false);

  // Use a ref to track merge status for this component instance
  const mergeStatusRef = useRef(globalMergeStatus);
  
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

  // Fetch cart from Redis on initial load and when user auth changes
  useEffect(() => {
    const fetchCart = async () => {
      setIsLoading(true);
      try {
        // The backend will create a session if needed
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

  // Function to handle cart merging with locking mechanism
  const handleCartMerge = async () => {
    // If merge is already completed or in progress, don't proceed
    if (mergeStatusRef.current.completed || mergeStatusRef.current.inProgress) {
      return;
    }
    
    try {
      // Set global flag to prevent other instances from starting a merge
      mergeStatusRef.current.inProgress = true;
      globalMergeStatus.inProgress = true;
      
      setIsLoading(true);
      
      // Attempt to merge carts
      await mergeCart();
      
      // Fetch the updated cart
      const mergedCart = await getCart();
      updateReduxCart(mergedCart);
      
      // Mark merge as completed globally
      mergeStatusRef.current.completed = true;
      globalMergeStatus.completed = true;
      
      console.log("Cart merge successful");
    } catch (err) {
      console.error("Failed to merge carts:", err);
    } finally {
      // Reset in-progress flag
      mergeStatusRef.current.inProgress = false;
      globalMergeStatus.inProgress = false;
      setIsLoading(false);
    }
  };

  // When user logs in, merge their guest cart with their user cart
  useEffect(() => {
    if (user?.id && !mergeStatusRef.current.completed) {
      handleCartMerge();
    }
  }, [user?.id]);

  // Export the merge function so it can be called from AuthContext
  const triggerCartMerge = () => {
    if (user?.id) {
      handleCartMerge();
    }
  };

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

      // Use the createCheckoutSession function from our API
      const response = await apiClient("/checkout", {
        method: "POST",
        body: checkoutData,
        requireAuth: !!user?.id,
      });

      // If we get a URL back, it's for Stripe checkout
      if (response.url) {
        return response; // Return the response so the checkout page can handle the redirect
      }

      // If we get here, the order was processed directly
      await clearCart();
      return response; // Return the order data
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
    triggerCartMerge, // Export the function
  };
}

