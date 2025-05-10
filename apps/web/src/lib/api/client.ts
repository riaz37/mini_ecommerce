// Define the API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type ApiClientOptions = {
  body?: any;
  method?: string;
  requireAuth?: boolean;
};

// Improved function to get the auth token from cookies
function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  // Method 1: Parse cookies manually
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'auth_token') {
      return value;
    }
  }
  
  // Method 2: Use regex as fallback
  const match = document.cookie.match(/auth_token=([^;]+)/);
  if (match) return match[1];
  
  // Method 3: Check localStorage as another fallback
  const localToken = localStorage.getItem('auth_token');
  if (localToken) {
    // If found in localStorage but not in cookies, set it as a cookie
    document.cookie = `auth_token=${localToken}; path=/; max-age=86400; SameSite=Strict`;
    return localToken;
  }
  
  return null;
}

// Add this function to normalize API responses
function normalizeProduct(product) {
  if (!product) return product;
  
  return {
    ...product,
    // Ensure price is a number
    price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
    // Ensure inStock is a boolean based on stock value
    inStock: product.inStock !== undefined ? product.inStock : (product.stock > 0)
  };
}

export async function apiClient(
  endpoint: string,
  options: ApiClientOptions = {}
) {
  const { body, method = "GET", requireAuth = false } = options;
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  // Add auth header if required
  if (requireAuth) {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const config: RequestInit = {
    method,
    headers,
    credentials: 'include', // This is important for cookies
    body: body ? JSON.stringify(body) : undefined,
  };
  
  // Ensure endpoint starts with a slash
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || response.statusText || 'Something went wrong';
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  
  // Normalize product data if it matches product structure
  if (endpoint.includes('/products/') || endpoint.includes('/products')) {
    if (Array.isArray(data)) {
      return data.map(normalizeProduct);
    } else if (data && typeof data === 'object' && 'id' in data) {
      return normalizeProduct(data);
    }
  }
  
  return data;
}
