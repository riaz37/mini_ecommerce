export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal?: number;
  tax?: number;
  total?: number;
}

export interface CartWithTotals extends Cart {
  subtotal: number;
  tax: number;
  total: number;
}