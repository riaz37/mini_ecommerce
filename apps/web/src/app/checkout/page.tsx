"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/context/AuthContext";
import { checkoutSchema } from "@/lib/validations";
import { ShippingAddress, PaymentMethod } from "@/lib/types";
import { ChevronLeft } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, isLoading: isCartLoading, checkout } = useCart();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login?redirect=/checkout");
    }
  }, [user, isAuthLoading, router]);

  // Calculate order summary values
  const { subtotal, shipping, tax, total } = useMemo(() => {
    // Calculate subtotal from cart items
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Calculate shipping (free over $50)
    const shipping = subtotal > 50 ? 0 : 5.99;

    // Calculate tax (8%)
    const tax = subtotal * 0.08;

    // Calculate total
    const total = subtotal + shipping + tax;

    return { subtotal, shipping, tax, total };
  }, [cart.items]);

  // Initialize form
  const form = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shippingAddress: {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      },
      paymentMethod: {
        type: "credit_card",
      },
    },
  });

  const onSubmit = async (data: z.infer<typeof checkoutSchema>) => {
    if (cart.items.length === 0) {
      setError("Your cart is empty");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare payment method in the format expected by backend
      const paymentMethod = {
        type: data.paymentMethod.type,
        details: {} // Backend doesn't expect details for initial checkout
      };

      // Use the checkout function from useCart hook
      const result = await checkout(
        data.shippingAddress as ShippingAddress,
        paymentMethod as PaymentMethod
      );

      // If we get a URL back, it's a redirect to Stripe
      if (result?.url) {
        window.location.href = result.url;
        return;
      }

      // If we get an order back, redirect to confirmation
      if (result?.id) {
        router.push(`/order-confirmation/${result.id}`);
        return;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Failed to process payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCartLoading || isAuthLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <LoadingSpinner size="xl" color="primary" text="Loading checkout..." />
      </div>
    );
  }

  // Don't render anything else if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <LoadingSpinner
          size="xl"
          color="primary"
          text="Redirecting to login..."
        />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-light">Your cart is empty</h1>
          <p className="text-gray-500">
            Add some items to your cart to checkout
          </p>
          <Button asChild variant="outline" size="lg">
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <Button
        variant="ghost"
        asChild
        className="mb-8 -ml-3 text-gray-600 hover:text-gray-900"
      >
        <Link href="/cart" className="flex items-center">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to cart
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-8">
          <div>
            <h1 className="text-3xl font-light mb-1">Checkout</h1>
            <p className="text-gray-500">Complete your purchase</p>
          </div>

          {error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
              <div className="space-y-6">
                <h2 className="text-xl font-medium">Shipping Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="shippingAddress.fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            Full Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="John Doe"
                              {...field}
                              className="border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="shippingAddress.street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            Street Address
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="123 Main St"
                              {...field}
                              className="border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="shippingAddress.address2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            Address Line 2 (Optional)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Apt 4B"
                              {...field}
                              className="border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="shippingAddress.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">City</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="New York"
                            {...field}
                            className="border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shippingAddress.state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          State / Province
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="NY"
                            {...field}
                            className="border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shippingAddress.postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          Postal Code
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="10001"
                            {...field}
                            className="border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shippingAddress.country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Country</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="United States"
                            {...field}
                            className="border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="shippingAddress.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            Phone Number
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(555) 123-4567"
                              {...field}
                              className="border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-6">
                <h2 className="text-xl font-medium">Payment Method</h2>

                <FormField
                  control={form.control}
                  name="paymentMethod.type"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="space-y-3"
                        >
                          <div className="border border-gray-200 rounded-lg p-4 transition-colors hover:bg-gray-50">
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem
                                  value="credit_card"
                                  id="credit_card"
                                />
                              </FormControl>
                              <FormLabel
                                htmlFor="credit_card"
                                className="font-medium cursor-pointer flex-1"
                              >
                                Credit Card
                                <p className="text-sm text-gray-500 font-normal mt-1">
                                  Pay with Visa, Mastercard, or American Express
                                </p>
                              </FormLabel>
                            </FormItem>
                          </div>

                          <div className="border border-gray-200 rounded-lg p-4 transition-colors hover:bg-gray-50">
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="paypal" id="paypal" />
                              </FormControl>
                              <FormLabel
                                htmlFor="paypal"
                                className="font-medium cursor-pointer flex-1"
                              >
                                PayPal
                                <p className="text-sm text-gray-500 font-normal mt-1">
                                  Pay with your PayPal account
                                </p>
                              </FormLabel>
                            </FormItem>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full py-6 text-base font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-300 rounded-lg border-0 transform hover:-translate-y-0.5"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <LoadingSpinner
                      size="sm"
                      color="white"
                      text="Processing..."
                    />
                  ) : (
                    "Complete Order"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-gray-50 rounded-xl p-6 sticky top-4">
            <h2 className="text-xl font-medium mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
              {cart.items.map((item) => (
                <div key={item.productId} className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-white rounded-md border border-gray-200 flex-shrink-0 overflow-hidden">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">
                      {item.name}
                    </h3>
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
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>
                  {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="flex justify-between font-medium text-lg">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 text-xs text-gray-500">
              <p>
                By completing your purchase, you agree to our{" "}
                <Link href="/terms" className="underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
