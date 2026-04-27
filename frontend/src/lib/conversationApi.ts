import { apiFetch } from "./api";

export async function startConversation(listingId: string) {
  return apiFetch(`/listings/${listingId}/conversations`, {
    method: "POST",
  });
}

export async function getConversations() {
  return apiFetch("/conversations", {
    method: "GET",
  });
}

export async function getConversationsForListing(listingId: string) {
  return apiFetch(`/listings/${listingId}/conversations`, {
    method: "GET",
  });
}

export async function markConversationSold(conversationId: string) {
  return apiFetch(`/conversations/${conversationId}/mark-sold`, {
    method: "PATCH",
  });
}

export async function markConversationCompleted(conversationId: string) {
  return apiFetch(`/conversations/${conversationId}/mark-completed`, {
    method: "PATCH",
  });
}