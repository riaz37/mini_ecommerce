// Define the API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// In-memory token storage (not accessible via XSS)
let inMemoryToken: string | null = null;

type ApiClientOptions = {
  body?: any;
  method?: string;
  requireAuth?: boolean;
  headers?: Record<string, string>;
};

// Set the auth token in memory
export function setAuthToken(token: string | null): void {
  inMemoryToken = token;
}

// Get auth token from memory
function getAuthToken(): string | null {
  return inMemoryToken;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { body, method = "GET", requireAuth = false, headers = {} } = options;
  
  const requestHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...headers
  };
  
  // Add auth header if available, regardless of requireAuth setting
  const token = getAuthToken();
  if (token) {
    requestHeaders["Authorization"] = `Bearer ${token}`;
  }
  
  // Only throw error if authentication is explicitly required AND no token is available
  if (requireAuth && !token && !endpoint.includes('/cart')) {
    throw new Error("Authentication required");
  }
  
  const config: RequestInit = {
    method,
    headers: requestHeaders,
    credentials: 'include', // Include cookies for refresh token and cart session
    body: body ? JSON.stringify(body) : undefined,
  };
  
  // Ensure endpoint starts with a slash
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  try {
    const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, config);
    
    // Handle token expiration
    if (response.status === 401 && inMemoryToken) {
      // Try to refresh the token
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry the original request with the new token
        return apiClient(endpoint, options);
      } else {
        // If refresh failed, clear token and throw error
        setAuthToken(null);
        throw new Error("Session expired. Please login again.");
      }
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle structured error responses from NestJS
      if (errorData.statusCode && errorData.message) {
        throw new Error(
          Array.isArray(errorData.message) 
            ? errorData.message.join(', ') 
            : errorData.message
        );
      }
      
      const errorMessage = errorData.message || response.statusText || 'Something went wrong';
      throw new Error(errorMessage);
    }
    
    // For endpoints that don't return JSON
    if (response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json();
      return data;
    }
    
    return {} as T;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

// Function to refresh the access token using the HTTP-only refresh token cookie
async function refreshToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // Include cookies
    });
    
    if (!response.ok) return false;
    
    const data = await response.json();
    setAuthToken(data.access_token);
    return true;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return false;
  }
}

// Add this function to normalize API responses
function normalizeProduct(product: any) {
  if (!product) return product;
  
  return {
    ...product,
    // Ensure price is a number
    price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
    // Ensure inStock is a boolean based on stock value
    inStock: product.inStock !== undefined ? product.inStock : (product.stock > 0)
  };
}
