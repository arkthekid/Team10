import { apiFetch } from "./api";

export async function blockUser(userId: string) {
  return apiFetch(`/blocks/${userId}`, {
    method: "POST",
  });
}

export async function getBlockedUsers() {
  return apiFetch("/blocks", {
    method: "GET",
  });
}

export async function unblockUser(userId: string) {
  return apiFetch(`/blocks/${userId}`, {
    method: "DELETE",
  });
}