import { apiFetch } from "./api";

export async function getSellerReviews(userId: string) {
  return apiFetch(`/reviews/${encodeURIComponent(userId)}`, {
    method: "GET",
  });
}

export async function createReview(
  userId: string,
  data: {
    rating: number;
    comment: string;
  }
) {
  return apiFetch(`/reviews/${encodeURIComponent(userId)}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}