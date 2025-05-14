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
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-light flex items-center">
          <Package className="mr-3 h-7 w-7 text-blue-600" />
          Order History
        </h1>
        <Button variant="ghost" asChild className="text-gray-600">
          <Link href="/account/profile" className="flex items-center">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Profile
          </Link>
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {!error && orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No orders yet
            </h3>
            <p className="text-gray-500 mb-6">
              You haven't placed any orders yet.
            </p>
            <Button asChild>
              <Link href="/products">Start Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <div className="bg-gray-50 p-4 flex flex-wrap justify-between items-center gap-4 border-b">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-mono text-sm">{order.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === "delivered"
                        ? "bg-green-100 text-green-800"
                        : order.status === "shipped"
                          ? "bg-blue-100 text-blue-800"
                          : order.status === "processing"
                            ? "bg-yellow-100 text-yellow-800"
                            : order.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {order.status.charAt(0) +
                      order.status.slice(1).toLowerCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-medium">${order.total.toFixed(2)}</p>
                </div>
                <div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/order-confirmation/${order.id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>

              <CardContent className="p-4">
                <h4 className="font-medium mb-3">Items</h4>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 py-2 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium truncate">
                          {item.name || "Product"}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-sm font-medium">
                        ${typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
