const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function removeToken() {
  localStorage.removeItem("token");
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let data: any = {};
  const text = await response.text();

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text || "Request failed" };
  }

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}