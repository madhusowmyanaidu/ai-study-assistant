const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://ai-study-assistant-dwne.onrender.com";

function getHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
}

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = getHeaders();

  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const mergedHeaders = {
    ...headers,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers: mergedHeaders,
  });

  if (!response.ok) {
    let errMsg = "Something went wrong";

    try {
      const data = await response.json();
      errMsg = data.detail || errMsg;
    } catch {
      try {
        errMsg = await response.text();
      } catch {}
    }

    throw new Error(errMsg);
  }

  return response.json();
}