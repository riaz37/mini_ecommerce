
import { apiClient } from './client';
import { Category } from '@/lib/types';

export async function getCategories(): Promise<Category[]> {
  return await apiClient('/categories');
}

export async function getCategoryById(id: string): Promise<Category> {
  return await apiClient(`/categories/${id}`);
}

export async function getCategoryProducts(categoryId: string, options = {}) {
  const queryParams = new URLSearchParams();
  
  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  }
  
  const queryString = queryParams.toString();
  const endpoint = `/categories/${categoryId}/products${queryString ? `?${queryString}` : ''}`;
  
  return await apiClient(endpoint);
}

