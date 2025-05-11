"use client";

import React, { useEffect, useCallback } from "react";
import { useCart } from "@/hooks/useCart";
import { useCartMerge } from "@/context/AuthContext";

export function CartMergeProvider({ children }: { children: React.ReactNode }) {
  const { triggerCartMerge } = useCart();
  const cartMergeContext = useCartMerge();

  // Connect the cart merge function to the auth context
  useEffect(() => {
    // Update the context's setter function with our cart merge function
    if (cartMergeContext) {
      cartMergeContext.triggerMerge = triggerCartMerge;
    }
  }, [triggerCartMerge, cartMergeContext]);

  return <>{children}</>;
}
