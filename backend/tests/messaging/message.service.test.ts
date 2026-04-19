import * as messageService from "../../src/services/messageService";
import { AppDataSource } from "../../src/config/data-source";
import { Message } from "../../src/entities/Message";
import { Conversation } from "../../src/entities/Conversation";
import { AppError } from "../../src/utils/AppError";

jest.mock("../../src/config/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe("messageService", () => {
  const mockMessageRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockConversationRepo = {
    findOne: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === Message) return mockMessageRepo;
      if (entity === Conversation) return mockConversationRepo;
    });
  });

  describe("getMessages", () => {
    // Success case
    it("returns messages for a conversation member", async () => {
      mockConversationRepo.findOne.mockResolvedValue({
        id: "conv-1",
        buyerId: "buyer-1",
        sellerId: "seller-1",
      });
      const mockMessages = [
        { id: "msg-1", body: "Hello", senderId: "buyer-1" },
        { id: "msg-2", body: "Hi!", senderId: "seller-1" },
      ];
      mockMessageRepo.find.mockResolvedValue(mockMessages);

      const result = await messageService.getMessages("conv-1", "buyer-1");

      expect(result).toEqual(mockMessages);
      expect(mockMessageRepo.find).toHaveBeenCalled();
    });

    // Error case - conversation not found
    it("throws 404 if conversation does not exist", async () => {
      mockConversationRepo.findOne.mockResolvedValue(null);

      await expect(
        messageService.getMessages("bad-conv", "buyer-1")
      ).rejects.toThrow("Conversation not found");
    });

    // Edge case - unauthorized
    it("throws 403 if user is not a member of the conversation", async () => {
      mockConversationRepo.findOne.mockResolvedValue({
        id: "conv-1",
        buyerId: "buyer-1",
        sellerId: "seller-1",
      });

      await expect(
        messageService.getMessages("conv-1", "stranger")
      ).rejects.toThrow("Unauthorized");
    });

    // Edge case - empty messages
    it("returns empty array when no messages exist", async () => {
      mockConversationRepo.findOne.mockResolvedValue({
        id: "conv-1",
        buyerId: "buyer-1",
        sellerId: "seller-1",
      });
      mockMessageRepo.find.mockResolvedValue([]);

      const result = await messageService.getMessages("conv-1", "buyer-1");

      expect(result).toEqual([]);
    });
  });

  describe("sendMessage", () => {
    // Success case
    it("sends a message successfully", async () => {
      mockConversationRepo.findOne.mockResolvedValue({
        id: "conv-1",
        buyerId: "buyer-1",
        sellerId: "seller-1",
      });
      mockMessageRepo.create.mockReturnValue({
        conversationId: "conv-1",
        senderId: "buyer-1",
        body: "Hello!",
      });
      mockMessageRepo.save.mockResolvedValue({
        id: "msg-1",
        conversationId: "conv-1",
        senderId: "buyer-1",
        body: "Hello!",
      });

      const result = await messageService.sendMessage("conv-1", "buyer-1", "Hello!");

      expect(result.body).toBe("Hello!");
      expect(result.senderId).toBe("buyer-1");
      expect(mockMessageRepo.save).toHaveBeenCalled();
    });

    // Error case - empty body
    it("throws 400 if message body is empty", async () => {
      mockConversationRepo.findOne.mockResolvedValue({
        id: "conv-1",
        buyerId: "buyer-1",
        sellerId: "seller-1",
      });

      await expect(
        messageService.sendMessage("conv-1", "buyer-1", "")
      ).rejects.toThrow("Message body cannot be empty");
    });

    // Error case - whitespace body
    it("throws 400 if message body is only whitespace", async () => {
      mockConversationRepo.findOne.mockResolvedValue({
        id: "conv-1",
        buyerId: "buyer-1",
        sellerId: "seller-1",
      });

      await expect(
        messageService.sendMessage("conv-1", "buyer-1", "   ")
      ).rejects.toThrow("Message body cannot be empty");
    });

    // Edge case - unauthorized sender
    it("throws 403 if sender is not a member of the conversation", async () => {
      mockConversationRepo.findOne.mockResolvedValue({
        id: "conv-1",
        buyerId: "buyer-1",
        sellerId: "seller-1",
      });

      await expect(
        messageService.sendMessage("conv-1", "stranger", "Hello!")
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("deleteMessage", () => {
    // Success case
    it("deletes message successfully", async () => {
      const mockMessage = {
        id: "msg-1",
        senderId: "buyer-1",
        body: "Hello!",
      };
      mockMessageRepo.findOne.mockResolvedValue(mockMessage);
      mockMessageRepo.remove.mockResolvedValue(undefined);

      await messageService.deleteMessage("msg-1", "buyer-1");

      expect(mockMessageRepo.remove).toHaveBeenCalledWith(mockMessage);
    });

    // Error case - message not found
    it("throws 404 if message does not exist", async () => {
      mockMessageRepo.findOne.mockResolvedValue(null);

      await expect(
        messageService.deleteMessage("bad-msg", "buyer-1")
      ).rejects.toThrow("Message not found");
    });

    // Edge case - unauthorized
    it("throws 403 if user is not the sender", async () => {
      mockMessageRepo.findOne.mockResolvedValue({
        id: "msg-1",
        senderId: "buyer-1",
        body: "Hello!",
      });

      await expect(
        messageService.deleteMessage("msg-1", "stranger")
      ).rejects.toThrow("Unauthorized");
    });

    // Edge case - remove fails
    it("throws if remove fails", async () => {
      mockMessageRepo.findOne.mockResolvedValue({
        id: "msg-1",
        senderId: "buyer-1",
      });
      mockMessageRepo.remove.mockRejectedValue(new Error("Remove failed"));

      await expect(
        messageService.deleteMessage("msg-1", "buyer-1")
      ).rejects.toThrow("Remove failed");
    });
  });
});