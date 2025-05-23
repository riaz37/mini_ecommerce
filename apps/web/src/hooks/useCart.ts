//@ts-nocheck
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { PaymentMethod, Product, ShippingAddress } from "@/lib/types";
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

  const mergeStatusRef = useRef(globalMergeStatus);

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

  const updateReduxCart = (serverCart) => {
    dispatch(
      hydrateCart({
        items: mapCartItems(serverCart),
        subtotal: serverCart.subtotal || 0,
        tax: serverCart.tax || 0,
        total: serverCart.total || 0,
      }),
    );
  };

  // Fetch cart whenever user changes or on initial load
  useEffect(() => {
    const fetchCart = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching cart for user:", user?.id || "guest");
        const serverCart = await getCart();
        console.log("Received cart from server:", serverCart);
        updateReduxCart(serverCart);
      } catch (err) {
        console.error("Failed to fetch cart:", err);
        setError(new Error("Failed to load your cart"));
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch cart immediately
    fetchCart();

    // If user just logged in, fetch cart again after a short delay
    // to ensure we get the latest user cart
    if (user?.id) {
      const refreshTimeout = setTimeout(() => {
        console.log("Refreshing cart after user login");
        fetchCart();
      }, 1000);
      
      return () => clearTimeout(refreshTimeout);
    }
  }, [user?.id]);

  const handleCartMerge = async () => {
    if (mergeStatusRef.current.completed || mergeStatusRef.current.inProgress)
      return;

    try {
      console.log("Starting cart merge process");
      mergeStatusRef.current.inProgress = true;
      globalMergeStatus.inProgress = true;
      setIsLoading(true);

      // Get the merged cart directly from the merge endpoint
      const mergedCart = await mergeCart();
      console.log("Received merged cart from server:", mergedCart);

      // Update Redux with the merged cart data
      updateReduxCart(mergedCart);

      // Force a refresh of the cart from the server to ensure consistency
      const refreshedCart = await getCart();
      updateReduxCart(refreshedCart);

      console.log("Cart merge successful", mergedCart);
      toast.success("Your cart has been updated with previous items", {
        duration: 3000,
        position: "bottom-right",
      });

      mergeStatusRef.current.completed = true;
      globalMergeStatus.completed = true;
    } catch (err) {
      console.error("Failed to merge carts:", err);
    } finally {
      mergeStatusRef.current.inProgress = false;
      globalMergeStatus.inProgress = false;
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && !mergeStatusRef.current.completed) {
      handleCartMerge();
    }
  }, [user?.id]);

  const triggerCartMerge = () => {
    if (user?.id) {
      handleCartMerge();
    }
  };

  const handleApiError = (error: any, defaultMessage: string) => {
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

      // Show success toast
      toast.success(`${product.name} added to cart!`, {
        duration: 3000,
        position: "bottom-right",
        icon: "🛒",
      });

      return updatedCart;
    } catch (error) {
      handleApiError(error, "Failed to add item to cart");

      // Show error toast
      toast.error("Failed to add item to cart", {
        duration: 3000,
        position: "bottom-right",
      });

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

      // Show success toast
      toast.success(`Cart updated!`, {
        duration: 2000,
        position: "bottom-right",
      });

      return updatedCart;
    } catch (error) {
      handleApiError(error, "Failed to update cart item");

      // Show error toast
      toast.error("Failed to update cart", {
        duration: 3000,
        position: "bottom-right",
      });

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

      // Show success toast
      toast.success(`Item removed from cart`, {
        duration: 2000,
        position: "bottom-right",
      });

      return updatedCart;
    } catch (error) {
      handleApiError(error, "Failed to remove item from cart");

      // Show error toast
      toast.error("Failed to remove item", {
        duration: 3000,
        position: "bottom-right",
      });

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const emptyCart = await clearCartApi();

      const normalizedCart = {
        items: emptyCart.items || [],
        subtotal: emptyCart.subtotal || 0,
        tax: emptyCart.tax || 0,
        total: emptyCart.total || 0,
      };

      dispatch(hydrateCart(normalizedCart));

      // Show success toast
      toast.success(`Cart cleared`, {
        duration: 2000,
        position: "bottom-right",
      });

      return normalizedCart;
    } catch (error) {
      handleApiError(error, "Failed to clear cart");

      // Show error toast
      toast.error("Failed to clear cart", {
        duration: 3000,
        position: "bottom-right",
      });

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const checkout = async (
    shippingAddress: ShippingAddress,
    paymentMethod: PaymentMethod,
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // Prepare checkout data, ensuring we only include customerId if user exists
      const checkoutData = {
        shippingAddress,
        paymentMethod: {
          type: paymentMethod.type,
          details: paymentMethod.details || {},
        },
        // Only include customerId if user exists and has a valid customerId
        ...(user?.id && user.customerId && { customerId: user.customerId }),
      };

      const response = await apiClient("/checkout", {
        method: "POST",
        body: checkoutData,
        requireAuth: !!user?.id,
      });

      if (response.url) {
        return response;
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
    triggerCartMerge,
  };
}
