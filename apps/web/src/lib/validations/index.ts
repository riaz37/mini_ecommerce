import * as z from "zod";

// Auth validations
export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
});

export const registerSchema = z
  .object({
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().min(1, { message: "Last name is required" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z
      .string()
      .min(8, { message: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Customer validations
export const customerSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  address: z.string().optional(),
  phone: z.string().optional(),
});

// Checkout validations
export const checkoutSchema = z.object({
  shippingAddress: z.object({
    fullName: z.string().min(1, { message: "Full name is required" }),
    address1: z.string().min(1, { message: "Address is required" }),
    address2: z.string().optional(),
    city: z.string().min(1, { message: "City is required" }),
    state: z.string().min(1, { message: "State is required" }),
    postalCode: z.string().min(1, { message: "Postal code is required" }),
    country: z.string().min(1, { message: "Country is required" }),
    phone: z.string().min(1, { message: "Phone number is required" }),
  }),
  paymentMethod: z.object({
    type: z.enum(["credit_card", "paypal"], {
      required_error: "Please select a payment method",
    }),
  }),
});

// Product validations
export const productFilterSchema = z.object({
  category: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  search: z.string().optional(),
});
