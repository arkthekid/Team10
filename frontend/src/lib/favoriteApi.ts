import { apiFetch } from "./api";

export async function addFavorite(listingId: string) {
  return apiFetch(`/favorites/${listingId}`, {
    method: "POST",
  });
}

export async function getMyFavorites() {
  return apiFetch("/favorites");
}

export async function removeFavorite(listingId: string) {
  return apiFetch(`/favorites/${listingId}`, {
    method: "DELETE",
  });
}