const rawApiBase = import.meta.env.VITE_API_BASE_URL || "";

// Extract token from URL search parameters on load and store it in localStorage
if (typeof window !== "undefined") {
  try {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      localStorage.setItem("itms_token", urlToken);
      const url = new URL(window.location.href);
      url.searchParams.delete("token");
      window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
    }
  } catch (e) {
    console.error("Failed to extract token from URL:", e);
  }
}

export function hasApiBaseUrl() {
  return Boolean(String(rawApiBase).trim());
}

function isProtectedFrontendFallbackRisk() {
  if (typeof window === "undefined") return false;
  return !hasApiBaseUrl() && /\.vercel\.app$/i.test(window.location.hostname);
}

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
  if (isProtectedFrontendFallbackRisk()) {
    throw new Error("Google sign-in is not configured for this deployment. Set VITE_API_BASE_URL to the backend URL in Vercel.");
  }
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
  const bypassToken = import.meta.env.VITE_VERCEL_BYPASS_TOKEN || import.meta.env.VITE_VERCEL_AUTOMATION_BYPASS_SECRET || "";
  const token = typeof window !== "undefined" ? localStorage.getItem("itms_token") : null;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
    ...(bypassToken ? { "x-vercel-protection-bypass": bypassToken } : {}),
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
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
  
  // Validate that the response is JSON
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  let data = {};
  if (isJson) {
    data = await response.json().catch(() => ({}));
  } else if (response.status !== 204) {
    throw new Error(
      "Invalid response from server. The request might have been blocked or redirected (e.g., by Vercel Deployment Protection). Please check your backend connection."
    );
  }

  // If the response is not OK, throw an error with the message from the response or a default message
  if (!response.ok) {
    const message = data?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  if (typeof window !== "undefined") {
    if (data && data.token) {
      localStorage.setItem("itms_token", data.token);
    }
    if (path && String(path).includes("/auth/logout")) {
      localStorage.removeItem("itms_token");
    }
  }

  // Return the parsed JSON data from the response
  return data;
}
