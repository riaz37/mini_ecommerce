// Define the API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type ApiClientOptions = {
  body?: any;
  method?: string;
  requireAuth?: boolean;
};

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
  
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || response.statusText || 'Something went wrong';
    throw new Error(errorMessage);
  }

  return response.json();
}
