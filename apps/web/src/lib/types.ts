// Product types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number | string;
  stock?: number;
  inStock?: boolean;
  rating?: number;
  reviewCount?: number;
  categoryId: string;
  category?: {
    id: string;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductFilters {
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// Category types
export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  parentId?: string;
  children?: Category[];
  productCount?: number;
}

// User types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "USER" | "ADMIN";
  customerId?: string;
}

// Cart types
export interface CartItem {
  productId: string;
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}

// Order types
export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PaymentMethod {
  type: "credit_card" | "bank_transfer";
  details: any;
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
  updatedAt: string;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
}

// Review types
export interface Review {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

// Add or update the Rating interface
export interface Rating {
  id?: string;
  productId: string;
  customerId: string;
  value: number;
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
  customer?: {
    id: string;
    name: string;
  };
  customerName?: string;
}
