"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getUserOrders } from "@/lib/api/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Link from "next/link";
import { Package, ChevronLeft, AlertCircle } from "lucide-react";
import { Order } from "@/lib/types";

export default function OrderHistoryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !user) {
      router.push("/login?redirect=/account/orders");
      return;
    }

    // Fetch orders if authenticated
    if (user) {
      const fetchOrders = async () => {
        try {
          setIsLoading(true);
          const orderData = await getUserOrders();
          setOrders(orderData);
        } catch (err) {
          console.error("Failed to fetch orders:", err);
          setError(
            "Could not load your order history. Please try again later."
          );
        } finally {
          setIsLoading(false);
        }
      };

      fetchOrders();
    }
  }, [user, authLoading, router]);

  if (authLoading || (isLoading && !error)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <LoadingSpinner
          size="xl"
          color="primary"
          text="Loading your orders..."
        />
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-light tracking-tight">
          <span className="flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-500" />
            Orders
          </span>
        </h1>
        <Button variant="ghost" asChild size="sm" className="text-gray-600">
          <Link href="/account/profile" className="flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {!error && orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-800 mb-2">No orders yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            You haven't placed any orders yet. Browse our products and start shopping.
          </p>
          <Button asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 flex flex-wrap justify-between items-center gap-4 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Order ID</p>
                  <p className="font-mono text-sm text-gray-600">{order.id.substring(0, 8)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Date</p>
                  <p className="text-sm">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Status</p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === "delivered"
                        ? "bg-green-50 text-green-700"
                        : order.status === "shipped"
                          ? "bg-blue-50 text-blue-700"
                          : order.status === "processing"
                            ? "bg-amber-50 text-amber-700"
                            : order.status === "cancelled"
                              ? "bg-red-50 text-red-700"
                              : "bg-gray-50 text-gray-700"
                    }`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total</p>
                  <p className="text-sm font-medium">
                    ${typeof order.total === 'number' ? order.total.toFixed(2) : parseFloat(order.total).toFixed(2)}
                  </p>
                </div>
                <div>
                  <Button asChild variant="outline" size="sm" className="rounded-full">
                    <Link href={`/order-confirmation/${order.id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="p-5">
                <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-3">Items</h4>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-md flex-shrink-0"></div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-800 truncate max-w-xs">
                            {item.name || "Product"}
                          </h3>
                          <p className="text-xs text-gray-500">
                            Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        ${typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
