const rawApiBase = import.meta.env.VITE_API_BASE_URL || "";

export function getApiBaseUrl() {
  const cleanBase = String(rawApiBase).trim().replace(/\/+$/, "");
  return cleanBase.replace(/\/api$/i, "");
}

export function apiUrl(path) {
  const base = getApiBaseUrl();
  const cleanPath = `/${String(path || "").replace(/^\/+/, "")}`;
  return `${base}${cleanPath}`;
}

export function buildGoogleAuthUrl(params) {
  const url = new URL(apiUrl("/api/auth/google"), window.location.origin);
  url.searchParams.set("clientOrigin", window.location.origin);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

// Utility function to make API requests with consistent error handling
export async function apiRequest(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };
  // Include credentials for cookie-based authentication
  const config = {
    method: options.method || "GET",
    headers,
    credentials: "include",
  };
  // If there's a body, stringify it (unless it's already a string)
  if (options.body) {
    if (isFormData) {
      config.body = options.body;
    } else {
      config.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
    }
  }
  // Make the API request
  const response = await fetch(apiUrl(path), config);
  const data = await response.json().catch(() => ({}));
  // If the response is not OK, throw an error with the message from the response or a default message
  if (!response.ok) {
    const message = data?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }
// Return the parsed JSON data from the response
  return data;
}
