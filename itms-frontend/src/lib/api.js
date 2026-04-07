const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

// Utility function to make API requests with consistent error handling
export async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
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
    config.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
  }
  // Make the API request
  const response = await fetch(`${API_BASE}${path}`, config);
  const data = await response.json().catch(() => ({}));
  // If the response is not OK, throw an error with the message from the response or a default message
  if (!response.ok) {
    const message = data?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }
// Return the parsed JSON data from the response
  return data;
}
