"use client";

import React from "react";
import { useCart } from "@/hooks/useCart";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Trash2, Minus, Plus } from "lucide-react";

interface CartItemProps {
  item: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  };
}

export default function CartItem({ item }: CartItemProps) {
  const { removeItem, updateItem, isLoading } = useCart();
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [isRemoving, setIsRemoving] = React.useState(false);

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > 10) return;
    if (newQuantity === item.quantity) return;

    setIsUpdating(true);
    try {
      await updateItem(item.productId, newQuantity);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await removeItem(item.productId);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      {/* Product Image */}
      <div className="w-20 h-20 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-grow min-w-0">
        <h3 className="text-lg font-medium text-gray-900 mb-1">{item.name}</h3>
        <p className="text-sm text-gray-500 mb-2">
          Unit Price: ${item.price.toFixed(2)}
        </p>

        {/* Mobile layout for price and quantity */}
        <div className="flex flex-col sm:hidden gap-3 mt-3">
          <div className="flex items-center">
            <div className="mr-auto">Quantity:</div>
            <div className="quantity-selector flex items-center">
              {renderQuantityControls()}
            </div>
          </div>
          <div className="flex items-center">
            <div className="mr-auto">Subtotal:</div>
            <div className="font-medium">
              ${(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop layout for quantity and price */}
      <div className="hidden sm:flex items-center gap-6">
        <div className="quantity-selector flex items-center">
          {renderQuantityControls()}
        </div>

        <div className="text-right">
          <div className="font-medium text-lg">
            ${(item.price * item.quantity).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={handleRemove}
        disabled={isRemoving}
        className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-1 cursor-pointer disabled:cursor-not-allowed"
        aria-label="Remove item"
      >
        {isRemoving ? (
          <LoadingSpinner size="xs" color="danger" />
        ) : (
          <Trash2 className="h-5 w-5" />
        )}
      </button>
    </div>
  );

  function renderQuantityControls() {
    return (
      <div className="flex items-center border border-gray-300 rounded-md">
        <button
          onClick={() => handleQuantityChange(item.quantity - 1)}
          disabled={isUpdating || item.quantity <= 1}
          className="px-2 py-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="relative px-2 py-1 w-10 text-center">
          {isUpdating ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingSpinner size="xs" color="primary" />
            </div>
          ) : (
            item.quantity
          )}
        </div>

        <button
          onClick={() => handleQuantityChange(item.quantity + 1)}
          disabled={isUpdating || item.quantity >= 10}
          className="px-2 py-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    );
  }
}
