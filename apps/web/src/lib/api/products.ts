//@ts-nocheck
import { apiClient } from "./client";
import { Product, ProductFilters } from "@/lib/types";

export async function getProducts(filters: ProductFilters = {}) {
  // Convert filters to query parameters
  const queryParams = new URLSearchParams();

  if (filters.categoryId) {
    queryParams.append("categoryId", filters.categoryId);
  }

  if (filters.search) {
    queryParams.append("search", filters.search);
  }

  if (filters.minPrice !== undefined) {
    queryParams.append("minPrice", filters.minPrice.toString());
  }

  if (filters.maxPrice !== undefined) {
    queryParams.append("maxPrice", filters.maxPrice.toString());
  }

  if (filters.sortBy) {
    queryParams.append("sortBy", filters.sortBy);
  }

  if (filters.sortOrder) {
    queryParams.append("sortOrder", filters.sortOrder);
  }

  if (filters.page) {
    queryParams.append("page", filters.page.toString());
  }

  if (filters.limit) {
    queryParams.append("limit", filters.limit.toString());
  }

  const queryString = queryParams.toString();
  const endpoint = `/products${queryString ? `?${queryString}` : ""}`;

  const products = await apiClient(endpoint);

  // Add inStock property to each product based on stock value
  return products.map((product) => ({
    ...product,
    inStock:
      product.inStock !== undefined ? product.inStock : product.stock > 0,
  }));
}

export async function getProductById(id: string): Promise<Product> {
  const product = await apiClient(`/products/${id}`);

  // Add inStock property based on stock value if it doesn't exist
  if (product.inStock === undefined && product.stock !== undefined) {
    product.inStock = product.stock > 0;
  }

  return product;
}

export async function getProductRatings(productId: string) {
  // Add a cache-busting parameter to ensure we get fresh data
  const timestamp = new Date().getTime();
  const ratings = await apiClient(
    `/products/${productId}/ratings?_t=${timestamp}`,
  );

  // Normalize the ratings data to ensure consistent structure
  return ratings.map((rating) => ({
    id: rating.id,
    productId: rating.productId,
    customerId: rating.customerId,
    value: rating.value,
    comment: rating.comment,
    createdAt: rating.createdAt,
    updatedAt: rating.updatedAt,
    customer: rating.customer,
    // For backward compatibility
    customerName: rating.customer?.name || rating.customerName || "Anonymous",
  }));
}

export async function rateProduct(
  productId: string,
  data: { rating: number; comment?: string },
) {
  // First, get the current user's information including customer ID
  try {
    const userInfo = await apiClient("/auth/me", { requireAuth: true });

    // Use the customer ID if available, otherwise use "current"
    const customerId = userInfo?.customerId || "current";

    return await apiClient(`/products/rate`, {
      method: "POST",
      body: {
        productId,
        customerId,
        value: data.rating,
        comment: data.comment,
      },
      requireAuth: true,
    });
  } catch (error) {
    console.error("Error getting user info:", error);

    // Fall back to using "current" if we can't get the user info
    return await apiClient(`/products/rate`, {
      method: "POST",
      body: {
        productId,
        customerId: "current",
        value: data.rating,
        comment: data.comment,
      },
      requireAuth: true,
    });
  }
}

export async function getFeaturedProducts() {
  return await apiClient("/products?featured=true");
}

export async function getNewArrivals() {
  return await apiClient("/products?sort=createdAt&order=desc&limit=8");
}

export async function getBestSellers() {
  return await apiClient("/products?sort=sales&order=desc&limit=8");
}
