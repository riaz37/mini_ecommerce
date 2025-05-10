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
  options = {}
): Promise<Product[]> {
  const queryParams = new URLSearchParams();

  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined) {
      queryParams.append(key, value !== null ? value.toString() : "");
    }
  }

  const queryString = queryParams.toString();
  const endpoint = `/categories/${categoryId}/products${queryString ? `?${queryString}` : ""}`;

  return await apiClient(endpoint);
}
