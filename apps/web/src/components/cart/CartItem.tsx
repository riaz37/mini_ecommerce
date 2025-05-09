"use client";

import React from "react";
import { useCart } from "@/hooks/useCart";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface CartItemProps {
  item: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
  };
}

export default function CartItem({ item }: CartItemProps) {
  const { removeItem, updateQuantity, isLoading } = useCart();
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [isRemoving, setIsRemoving] = React.useState(false);

  const handleQuantityChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newQuantity = parseInt(e.target.value, 10);
    setIsUpdating(true);
    await updateQuantity(item.productId, newQuantity);
    setIsUpdating(false);
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    await removeItem(item.productId);
    setIsRemoving(false);
  };

  return (
    <div className="flex items-center py-4 border-b">
      <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">
        {/* Placeholder for product image */}
        <span className="text-gray-400 text-xs">Image</span>
      </div>

      <div className="ml-4 flex-grow">
        <h3 className="text-sm font-medium">{item.name}</h3>
        <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
      </div>

      <div className="flex items-center">
        <div className="relative">
          <select
            value={item.quantity}
            onChange={handleQuantityChange}
            className="border rounded p-1 text-sm mr-4"
            disabled={isUpdating}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
          {isUpdating && (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingSpinner size="xs" color="primary" />
            </div>
          )}
        </div>

        <button
          onClick={handleRemove}
          className="text-red-500 hover:text-red-700 text-sm flex items-center"
          disabled={isRemoving}
        >
          {isRemoving ? <LoadingSpinner size="xs" color="danger" /> : "Remove"}
        </button>
      </div>
    </div>
  );
}
