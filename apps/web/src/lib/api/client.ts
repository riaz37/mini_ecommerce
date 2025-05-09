// Define the API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type ApiOptions = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  requireAuth?: boolean;
};

export async function apiClient(
  endpoint: string,
  { method = "GET", body, headers = {}, requireAuth = false }: ApiOptions = {},
) {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: "include", // Include cookies for auth and session
  };

  if (requireAuth) {
    // Get token from cookie (handled by credentials: 'include')
    // No need to manually set Authorization header as the cookie will be sent
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || response.statusText || 'Something went wrong';
    throw new Error(errorMessage);
  }

  return response.json();
}
