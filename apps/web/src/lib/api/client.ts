const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// We'll keep this for backward compatibility, but it won't be the primary auth method
let inMemoryToken: string | null = null;

type ApiClientOptions = {
  body?: any;
  method?: string;
  requireAuth?: boolean;
  headers?: Record<string, string>;
};

export function setAuthToken(token: string | null): void {
  inMemoryToken = token;
}

function getAuthToken(): string | null {
  return inMemoryToken;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: ApiClientOptions = {},
): Promise<T> {
  const { body, method = "GET", requireAuth = false, headers = {} } = options;

  const requestHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...headers,
  };

  // We'll still include the token in the Authorization header if available
  // for backward compatibility, but the primary auth will be via cookies
  const token = getAuthToken();
  if (token) {
    requestHeaders["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers: requestHeaders,
    credentials: "include", // This ensures cookies are sent with the request
    body: body ? JSON.stringify(body) : undefined,
  };

  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  console.log(`Making ${method} request to ${normalizedEndpoint}`, {
    withCredentials: true,
  });

  try {
    const response = await fetch(
      `${API_BASE_URL}${normalizedEndpoint}`,
      config,
    );

    if (response.status === 401) {
      // Try to refresh the token
      const refreshed = await refreshToken();
      if (refreshed) {
        return apiClient(endpoint, options);
      } else {
        throw new Error("Session expired. Please login again.");
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.statusCode && errorData.message) {
        throw new Error(
          Array.isArray(errorData.message)
            ? errorData.message.join(", ")
            : errorData.message,
        );
      }

      const errorMessage =
        errorData.message || response.statusText || "Something went wrong";
      throw new Error(errorMessage);
    }

    if (response.headers.get("content-type")?.includes("application/json")) {
      return await response.json();
    }

    return {} as T;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

async function refreshToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include", // Include cookies
    });

    if (!response.ok) return false;

    // We don't need to extract the token since it's in the cookies
    return true;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return false;
  }
}

function normalizeProduct(product: any) {
  if (!product) return product;

  return {
    ...product,
    price:
      typeof product.price === "string"
        ? parseFloat(product.price)
        : product.price,
    inStock:
      product.inStock !== undefined ? product.inStock : product.stock > 0,
  };
}
