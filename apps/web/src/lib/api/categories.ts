import { apiClient } from "./client";
import { Category, Product } from "@/lib/types";

export async function getCategories(): Promise<Category[]> {
  return await apiClient("/categories");
}

export async function getCategoryById(id: string): Promise<Category> {
  return await apiClient(`/categories/${id}`);
}

export async function getCategoryProducts(
  categoryId: string,
  limit?: number,
  page?: number
): Promise<Product[]> {
  const queryParams = new URLSearchParams();
  
  if (limit) {
    queryParams.append("limit", limit.toString());
  }
  
  if (page) {
    queryParams.append("page", page.toString());
  }
  
  const queryString = queryParams.toString();
  const endpoint = `/categories/${categoryId}/products${queryString ? `?${queryString}` : ""}`;
  
  const products = await apiClient(endpoint);
  
  // Add inStock property to each product based on stock value
  return products.map(product => ({
    ...product,
    inStock: product.inStock !== undefined ? product.inStock : (product.stock > 0)
  }));
}
