export async function apiClient(
  endpoint: string,
  options: {
    method?: string;
    body?: any;
    requireAuth?: boolean;
    headers?: Record<string, string>;
  } = {}
) {
  const { method = "GET", body, requireAuth = false, headers = {} } = options;

  // Base URL from environment variable
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  
  // Ensure endpoint starts with a slash
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${normalizedEndpoint}`;

  // Default headers
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Merge default headers with custom headers
  const mergedHeaders = { ...defaultHeaders, ...headers };

  // Request options
  const requestOptions: RequestInit = {
    method,
    headers: mergedHeaders,
    credentials: "include", // Important for cookies
  };

  // Add body if present
  if (body) {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, requestOptions);

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") === -1) {
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      return await response.text();
    }

    // Parse JSON response
    const data = await response.json();

    // Handle API errors
    if (!response.ok) {
      const error = data.message || "An error occurred";
      throw new Error(error);
    }

    return data;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}
