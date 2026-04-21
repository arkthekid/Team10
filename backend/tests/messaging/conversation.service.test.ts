import * as conversationService from "../../src/services/conversationService";
import { AppDataSource } from "../../src/config/data-source";
import { Conversation } from "../../src/entities/Conversation";
import { Listing } from "../../src/entities/Listing";
import { AppError } from "../../src/utils/AppError";

jest.mock("../../src/config/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe("conversationService", () => {
  const mockConversationRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockListingRepo = {
    findOne: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === Conversation) return mockConversationRepo;
      if (entity === Listing) return mockListingRepo;
    });
  });

  describe("startConversation", () => {
    // Success case
    it("creates a new conversation successfully", async () => {
      mockListingRepo.findOne.mockResolvedValue({
        listingId: "listing-1",
        sellerId: "seller-1",
      });
      mockConversationRepo.findOne.mockResolvedValue(null);
      mockConversationRepo.create.mockReturnValue({
        listingId: "listing-1",
        buyerId: "buyer-1",
        sellerId: "seller-1",
      });
      mockConversationRepo.save.mockResolvedValue({
        id: "conv-1",
        listingId: "listing-1",
        buyerId: "buyer-1",
        sellerId: "seller-1",
      });

      const result = await conversationService.startConversation(
        "listing-1",
        "buyer-1",
      );

      expect(result.listingId).toBe("listing-1");
      expect(result.buyerId).toBe("buyer-1");
      expect(result.sellerId).toBe("seller-1");
      expect(mockConversationRepo.save).toHaveBeenCalled();
    });

    // Success case - returns existing conversation
    it("returns existing conversation if one already exists", async () => {
      mockListingRepo.findOne.mockResolvedValue({
        listingId: "listing-1",
        sellerId: "seller-1",
      });
      const existing = {
        id: "conv-1",
        listingId: "listing-1",
        buyerId: "buyer-1",
        sellerId: "seller-1",
      };
      mockConversationRepo.findOne.mockResolvedValue(existing);

      const result = await conversationService.startConversation(
        "listing-1",
        "buyer-1",
      );

      expect(result).toEqual(existing);
      expect(mockConversationRepo.save).not.toHaveBeenCalled();
    });

    // Error case - listing not found
    it("throws 404 if listing does not exist", async () => {
      mockListingRepo.findOne.mockResolvedValue(null);

      await expect(
        conversationService.startConversation("bad-listing", "buyer-1"),
      ).rejects.toThrow("Listing not found");
    });

    // Edge case - buyer is seller
    it("throws 400 if buyer tries to message themselves", async () => {
      mockListingRepo.findOne.mockResolvedValue({
        listingId: "listing-1",
        sellerId: "same-user",
      });

      await expect(
        conversationService.startConversation("listing-1", "same-user"),
      ).rejects.toThrow("You cannot message yourself");
    });
  });

  describe("getMyConversations", () => {
    // Success case
    it("returns all conversations for a user", async () => {
      const mockConversations = [
        { id: "conv-1", buyerId: "user-1", sellerId: "seller-1" },
        { id: "conv-2", buyerId: "buyer-2", sellerId: "user-1" },
      ];
      mockConversationRepo.find.mockResolvedValue(mockConversations);

      const result = await conversationService.getMyConversations("user-1");

      expect(result).toEqual(mockConversations);
      expect(mockConversationRepo.find).toHaveBeenCalled();
    });

    // Edge case - no conversations
    it("returns empty array when user has no conversations", async () => {
      mockConversationRepo.find.mockResolvedValue([]);

      const result = await conversationService.getMyConversations("user-1");

      expect(result).toEqual([]);
    });

    // Error case - repo fails
    it("throws if repository fails", async () => {
      mockConversationRepo.find.mockRejectedValue(new Error("DB error"));

      await expect(
        conversationService.getMyConversations("user-1"),
      ).rejects.toThrow("DB error");
    });
  });

  describe("getConversationById", () => {
    // Success case
    it("returns conversation for a member", async () => {
      const mockConversation = {
        id: "conv-1",
        buyerId: "buyer-1",
        sellerId: "seller-1",
      };
      mockConversationRepo.findOne.mockResolvedValue(mockConversation);

      const result = await conversationService.getConversationById(
        "conv-1",
        "buyer-1",
      );

      expect(result).toEqual(mockConversation);
    });

    // Error case - not found
    it("throws 404 if conversation does not exist", async () => {
      mockConversationRepo.findOne.mockResolvedValue(null);

      await expect(
        conversationService.getConversationById("bad-conv", "buyer-1"),
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
        conversationService.getConversationById("conv-1", "stranger"),
      ).rejects.toThrow("Unauthorized");
    });

    // Edge case - seller can also access
    it("allows seller to access the conversation", async () => {
      const mockConversation = {
        id: "conv-1",
        buyerId: "buyer-1",
        sellerId: "seller-1",
      };
      mockConversationRepo.findOne.mockResolvedValue(mockConversation);

      const result = await conversationService.getConversationById(
        "conv-1",
        "seller-1",
      );

      expect(result).toEqual(mockConversation);
    });
  });

  describe("deleteConversation", () => {
    // Success case
    it("deletes conversation successfully", async () => {
      const mockConversation = {
        id: "conv-1",
        buyerId: "buyer-1",
        sellerId: "seller-1",
      };
      mockConversationRepo.findOne.mockResolvedValue(mockConversation);
      mockConversationRepo.remove.mockResolvedValue(undefined);

      await conversationService.deleteConversation("conv-1", "buyer-1");

      expect(mockConversationRepo.remove).toHaveBeenCalledWith(
        mockConversation,
      );
    });

    // Error case - not found
    it("throws 404 if conversation does not exist", async () => {
      mockConversationRepo.findOne.mockResolvedValue(null);

      await expect(
        conversationService.deleteConversation("bad-conv", "buyer-1"),
      ).rejects.toThrow("Conversation not found");
    });

    // Edge case - unauthorized
    it("throws 403 if user is not a member", async () => {
      mockConversationRepo.findOne.mockResolvedValue({
        id: "conv-1",
        buyerId: "buyer-1",
        sellerId: "seller-1",
      });

      await expect(
        conversationService.deleteConversation("conv-1", "stranger"),
      ).rejects.toThrow("Unauthorized");
    });

    // Edge case - remove fails
    it("throws if remove fails", async () => {
      mockConversationRepo.findOne.mockResolvedValue({
        id: "conv-1",
        buyerId: "buyer-1",
        sellerId: "seller-1",
      });
      mockConversationRepo.remove.mockRejectedValue(new Error("Remove failed"));

      await expect(
        conversationService.deleteConversation("conv-1", "buyer-1"),
      ).rejects.toThrow("Remove failed");
    });

    // Inside startConversation describe
    it("saves correct sellerId from listing not from request", async () => {
      mockListingRepo.findOne.mockResolvedValue({
        listingId: "listing-1",
        sellerId: "real-seller",
      });
      mockConversationRepo.findOne.mockResolvedValue(null);
      mockConversationRepo.create.mockReturnValue({
        listingId: "listing-1",
        buyerId: "buyer-1",
        sellerId: "real-seller",
      });
      mockConversationRepo.save.mockResolvedValue({
        id: "conv-1",
        listingId: "listing-1",
        buyerId: "buyer-1",
        sellerId: "real-seller",
      });

      const result = await conversationService.startConversation(
        "listing-1",
        "buyer-1",
      );

      expect(result.sellerId).toBe("real-seller");
    });

    // Inside getConversationsForListing describe - add this describe block
    describe("getConversationsForListing", () => {
      it("returns conversations for a listing", async () => {
        const mockConversations = [
          {
            id: "conv-1",
            listingId: "listing-1",
            buyerId: "buyer-1",
            sellerId: "seller-1",
          },
        ];
        mockConversationRepo.find.mockResolvedValue(mockConversations);

        const result = await conversationService.getConversationsForListing(
          "listing-1",
          "seller-1",
        );

        expect(result).toEqual(mockConversations);
        expect(mockConversationRepo.find).toHaveBeenCalled();
      });

      it("returns empty array if no conversations for listing", async () => {
        mockConversationRepo.find.mockResolvedValue([]);

        const result = await conversationService.getConversationsForListing(
          "listing-1",
          "seller-1",
        );

        expect(result).toEqual([]);
      });

      it("throws if repository fails", async () => {
        mockConversationRepo.find.mockRejectedValue(new Error("DB error"));

        await expect(
          conversationService.getConversationsForListing(
            "listing-1",
            "seller-1",
          ),
        ).rejects.toThrow("DB error");
      });
    });
  });
});
