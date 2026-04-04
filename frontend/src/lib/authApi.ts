import { apiFetch, setToken, removeToken } from "./api";

export async function registerUser(userData: {
  name: string;
  umassEmail: string;
  password: string;
}) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: userData.name,
      umassEmail: userData.umassEmail,
      password: userData.password,
    }),
  });
}

export async function loginUser(credentials: {
  umassEmail: string;
  password: string;
}) {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      umassEmail: credentials.umassEmail,
      password: credentials.password,
    }),
  });

  if (data.token) {
    setToken(data.token);
  }

  return data;
}

export function logoutUser() {
  removeToken();
}