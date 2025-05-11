"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <XCircle className="h-16 w-16 text-amber-500" />
        </div>
        <h1 className="text-3xl font-light mb-4">Payment Cancelled</h1>
        <p className="text-gray-600 mb-8">
          Your payment was cancelled. Your cart items are still saved.
        </p>
        <div className="flex flex-col space-y-4">
          <Button onClick={() => router.push("/checkout")}>
            Return to Checkout
          </Button>
          <Button variant="outline" onClick={() => router.push("/")}>
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
}