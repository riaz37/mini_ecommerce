"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getOrderById } from "@/lib/api/checkout";
import { Order } from "@/lib/types";
import { CheckCircle, Package, Truck, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function OrderConfirmationPage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        const orderId = params.id as string;
        const orderData = await getOrderById(orderId);
        setOrder(orderData);
      } catch (err) {
        console.error("Failed to fetch order:", err);
        setError(
          "We couldn't find your order. Please contact customer support."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <LoadingSpinner
          size="xl"
          color="primary"
          text="Loading order details..."
        />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-light">Order Not Found</h1>
          <p className="text-gray-500">
            {error || "We couldn't find your order."}
          </p>
          <Button asChild variant="outline" size="lg">
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-light mb-2">Order Confirmed!</h1>
          <p className="text-gray-600">
            Thank you for your purchase. Your order has been received.
          </p>
          <div className="mt-4 inline-block bg-gray-100 px-4 py-2 rounded-full">
            <span className="text-gray-700 font-medium">Order ID: </span>
            <span className="font-mono">{order.id}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Package className="h-5 w-5 text-gray-700 mr-2" />
              <h3 className="font-medium">Order Status</h3>
            </div>
            <p className="text-sm capitalize">{order.status}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Truck className="h-5 w-5 text-gray-700 mr-2" />
              <h3 className="font-medium">Shipping Method</h3>
            </div>
            <p className="text-sm">Standard Shipping</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Home className="h-5 w-5 text-gray-700 mr-2" />
              <h3 className="font-medium">Payment Method</h3>
            </div>
            <p className="text-sm capitalize">
              {order.paymentMethod.type.replace("_", " ")}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-medium mb-4">Order Summary</h2>
          <div className="space-y-4 mb-6">
            {order.items.map((item) => (
              <div key={item.productId} className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-md border border-gray-200 flex-shrink-0 overflow-hidden">
                  {/* Item image placeholder since OrderItem doesn't have image property */}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium truncate">{item.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Qty: {item.quantity}
                  </p>
                </div>
                <div className="text-sm font-medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-6" />

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span>
                Free
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span>${order.tax.toFixed(2)}</span>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex justify-between font-medium text-lg">
            <span>Total</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-medium mb-4">Shipping Address</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-medium">{order.shippingAddress.street}</p>
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.postalCode}
            </p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="outline">
            <Link href="/account/orders">View All Orders</Link>
          </Button>
          <Button asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
