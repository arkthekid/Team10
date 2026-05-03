import { apiFetch } from "./api";

export async function getSellerReviews(userId: string) {
  return apiFetch(`/reviews/${encodeURIComponent(userId)}`, {
    method: "GET",
  });
}