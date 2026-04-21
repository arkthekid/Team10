import { AppDataSource } from "../config/data-source";
import { Message } from "../entities/Message";
import { Conversation } from "../entities/Conversation";
import { AppError } from "../utils/AppError";

const messageRepo = () => AppDataSource.getRepository(Message);
const conversationRepo = () => AppDataSource.getRepository(Conversation);

const assertMember = async (conversationId: string, userId: string) => {
  const conversation = await conversationRepo().findOne({
    where: { id: conversationId },
  });
  if (!conversation) throw new AppError("Conversation not found", 404);
  if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
    throw new AppError("Unauthorized", 403);
  }
  return conversation;
};

export const getMessages = async (conversationId: string, userId: string) => {
  await assertMember(conversationId, userId);

  return messageRepo().find({
    where: { conversationId },
    relations: ["sender"],
    order: { createdAt: "ASC" },
  });
};

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  body: string
) => {
  await assertMember(conversationId, senderId);

  if (!body || body.trim() === "") {
    throw new AppError("Message body cannot be empty", 400);
  }

  const message = messageRepo().create({ conversationId, senderId, body });
  return messageRepo().save(message);
};

export const deleteMessage = async (messageId: string, userId: string) => {
  const message = await messageRepo().findOne({ where: { id: messageId } });

  if (!message) throw new AppError("Message not found", 404);

  if (message.senderId !== userId) throw new AppError("Unauthorized", 403);

  await messageRepo().remove(message);
};