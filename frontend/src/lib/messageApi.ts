import { apiFetch } from "./api";

export async function getMessages(conversationId: string) {
  return apiFetch(`/conversations/${conversationId}/messages`, {
    method: "GET",
  });
}

export async function sendMessage(conversationId: string, body: string) {
  return apiFetch(`/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export async function deleteMessage(messageId: string) {
  return apiFetch(`/messages/${messageId}`, {
    method: "DELETE",
  });
}