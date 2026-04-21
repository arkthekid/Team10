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

export async function googleLogin(idToken: string) {
  const data = await apiFetch("/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });

  if (data.token) {
    setToken(data.token);
  }

  return data;
}

export async function logoutUser() {
  try {
    await apiFetch("/auth/logout", {
      method: "GET",
    });
  } finally {
    removeToken();
  }
}