
import { apiClient } from './client';
import { Product, ProductFilters } from '@/lib/types';

export async function getProducts(filters: ProductFilters = {}) {
  // Convert filters to query parameters
  const queryParams = new URLSearchParams();
  
  if (filters.categoryId) {
    queryParams.append('categoryId', filters.categoryId);
  }
  
  if (filters.search) {
    queryParams.append('search', filters.search);
  }
  
  if (filters.minPrice) {
    queryParams.append('minPrice', filters.minPrice.toString());
  }
  
  if (filters.maxPrice) {
    queryParams.append('maxPrice', filters.maxPrice.toString());
  }
  
  if (filters.sortBy) {
    queryParams.append('sortBy', filters.sortBy);
  }
  
  if (filters.sortOrder) {
    queryParams.append('sortOrder', filters.sortOrder);
  }
  
  if (filters.page) {
    queryParams.append('page', filters.page.toString());
  }
  
  if (filters.limit) {
    queryParams.append('limit', filters.limit.toString());
  }
  
  const queryString = queryParams.toString();
  const endpoint = `/products${queryString ? `?${queryString}` : ''}`;
  
  return await apiClient(endpoint);
}

export async function getProductById(id: string): Promise<Product> {
  return await apiClient(`/products/${id}`);
}

export async function getProductRatings(productId: string) {
  return await apiClient(`/products/${productId}/ratings`);
}

export async function rateProduct(productId: string, data: { rating: number; comment?: string }) {
  return await apiClient(`/products/${productId}/ratings`, {
    method: 'POST',
    body: data,
    requireAuth: true,
  });
}

export async function getFeaturedProducts() {
  return await apiClient('/products/featured');
}

export async function getNewArrivals() {
  return await apiClient('/products/new-arrivals');
}

export async function getBestSellers() {
  return await apiClient('/products/best-sellers');
}

