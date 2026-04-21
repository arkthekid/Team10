const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

function getToken() {
  return localStorage.getItem("token");
}

export async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);

  const token = getToken();

  const response = await fetch(`${API_URL}/upload`, {
    method: "POST",
    body: formData,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const text = await response.text();
  let data: any = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  console.log("UPLOAD STATUS:", response.status);
  console.log("UPLOAD RESPONSE:", data);

  if (!response.ok) {
    throw new Error(data.message || data.error || "Image upload failed");
  }

  return data;
}