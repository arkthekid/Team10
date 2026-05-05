import * as listingService from "../../src/services/listingService";
import { AppDataSource } from "../../src/config/data-source";
import { Listing } from "../../src/entities/Listing";
import { Conversation } from "../../src/entities/Conversation";
import { CategoryEntity } from "../../src/entities/Category";

jest.mock("../../src/config/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock("../../src/services/blockService", () => ({
  getBlockerIdsForUser: jest.fn().mockResolvedValue([]),
}));

describe("listingService", () => {
  const mockListingRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
    findBy: jest.fn(),
    count: jest.fn(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
  };

  const mockCategoryRepo = {
    findBy: jest.fn(),
  };

  const mockConversationRepo = {
    count: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCategoryRepo.findBy.mockResolvedValue([]);
    mockConversationRepo.count.mockResolvedValue(0);
    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === CategoryEntity) return mockCategoryRepo;
      if (entity === Conversation) return mockConversationRepo;
      return mockListingRepo;
    });
  });

  describe("createListing", () => {
    it("should successfully create and return a listing", async () => {
      const mockInput: Partial<Listing> = { name: "Table" };
      const mockCreatedListing: any = { name: "Table" };
      const mockSavedListing = { id: "1", name: "Table", sellerId: "user123" };

      mockListingRepo.create.mockReturnValue(mockCreatedListing);
      mockListingRepo.save.mockResolvedValue(mockSavedListing);

      const result = await listingService.createListing(mockInput, [], "user123");

      expect(mockListingRepo.create).toHaveBeenCalledWith(mockInput);
      expect(mockCreatedListing.sellerId).toBe("user123");
      expect(mockListingRepo.save).toHaveBeenCalledWith(mockCreatedListing);
      expect(result).toEqual(mockSavedListing);
    });

    it("should overwrite incoming sellerId with authenticated userId", async () => {
      const mockCreatedListing: any = { name: "Desk", sellerId: "bad-user" };

      mockListingRepo.create.mockReturnValue(mockCreatedListing);
      mockListingRepo.save.mockImplementation(async (listing) => listing);

      const result = await listingService.createListing(
        { name: "Desk", sellerId: "bad-user" } as Partial<Listing>,
        [],
        "user123",
      );

      expect(result.sellerId).toBe("user123");
    });

    it("should throw error if repository is not found", async () => {
      (AppDataSource.getRepository as jest.Mock).mockImplementation(() => {
        throw new Error("Repo not found");
      });

      await expect(
        listingService.createListing({ name: "Test" }, [], "user123"),
      ).rejects.toThrow("Repo not found");
    });

    it("should throw error if create fails", async () => {
      mockListingRepo.create.mockImplementation(() => {
        throw new Error("Create failed");
      });

      await expect(
        listingService.createListing({ name: "Test" }, [], "user123"),
      ).rejects.toThrow("Create failed");

      expect(mockListingRepo.save).not.toHaveBeenCalled();
    });

    it("should throw error if save fails", async () => {
      mockListingRepo.create.mockReturnValue({ name: "Test" });
      mockListingRepo.save.mockRejectedValue(new Error("Save failed"));

      await expect(
        listingService.createListing({ name: "Test" }, [], "user123"),
      ).rejects.toThrow("Save failed");
    });

    it("should save two listings sequentially", async () => {
      mockListingRepo.create
        .mockReturnValueOnce({ name: "Textbook 320" })
        .mockReturnValueOnce({ name: "Wooden chair" });
      mockListingRepo.save
        .mockResolvedValueOnce({ id: "1", name: "Textbook 320", sellerId: "user123" })
        .mockResolvedValueOnce({ id: "2", name: "Wooden chair", sellerId: "user234" });

      const result1 = await listingService.createListing({ name: "Textbook 320" }, [], "user123");
      const result2 = await listingService.createListing({ name: "Wooden chair" }, [], "user234");

      expect(mockListingRepo.create).toHaveBeenCalledTimes(2);
      expect(mockListingRepo.save).toHaveBeenCalledTimes(2);
      expect(result1).toEqual({ id: "1", name: "Textbook 320", sellerId: "user123" });
      expect(result2).toEqual({ id: "2", name: "Wooden chair", sellerId: "user234" });
    });
  });

  describe("updateListing", () => {
    it("should update a listing successfully", async () => {
      const existingListing = {
        listingId: "listing-1",
        sellerId: "user123",
        name: "Old Desk",
        price: 100,
        category: "furniture",
      };
      const savedListing = { ...existingListing, name: "New Desk", price: 150 };

      mockListingRepo.findOne.mockResolvedValue(existingListing);
      mockListingRepo.save.mockResolvedValue(savedListing);

      const result = await listingService.updateListing(
        "listing-1",
        { name: "New Desk", price: 150 },
        "user123",
      );

      expect(mockListingRepo.findOne).toHaveBeenCalledWith({ where: { listingId: "listing-1" } });
      expect(result).toEqual(savedListing);
    });

    it("should throw error if listing does not exist", async () => {
      mockListingRepo.findOne.mockResolvedValue(null);

      await expect(
        listingService.updateListing("missing-id", { name: "Desk" }, "user123"),
      ).rejects.toThrow("Listing not found");

      expect(mockListingRepo.save).not.toHaveBeenCalled();
    });

    it("should throw error if user does not own the listing", async () => {
      mockListingRepo.findOne.mockResolvedValue({
        listingId: "listing-1",
        sellerId: "otherUser",
        name: "Desk",
      });

      await expect(
        listingService.updateListing("listing-1", { name: "New Name" }, "user123"),
      ).rejects.toThrow("Unauthorized");

      expect(mockListingRepo.save).not.toHaveBeenCalled();
    });

    it("should not allow sellerId or listingId to be overwritten", async () => {
      const existingListing = {
        listingId: "listing-1",
        sellerId: "user123",
        name: "Desk",
        price: 100,
      };

      mockListingRepo.findOne.mockResolvedValue(existingListing);
      mockListingRepo.save.mockImplementation(async (listing) => listing);

      const result = await listingService.updateListing(
        "listing-1",
        { name: "Updated Desk", sellerId: "hacker", listingId: "fake-id" } as Partial<Listing>,
        "user123",
      );

      expect(result.sellerId).toBe("user123");
      expect(result.listingId).toBe("listing-1");
      expect(result.name).toBe("Updated Desk");
    });
  });

  describe("deleteListing", () => {
    it("should delete a listing successfully", async () => {
      const existingListing = { listingId: "listing-1", sellerId: "user123", name: "Desk" };

      mockListingRepo.findOne.mockResolvedValue(existingListing);
      mockListingRepo.remove.mockResolvedValue(existingListing);

      const result = await listingService.deleteListing("listing-1", "user123");

      expect(mockListingRepo.remove).toHaveBeenCalledWith(existingListing);
      expect(result).toEqual({ message: "Listing deleted successfully" });
    });

    it("should throw error if listing does not exist", async () => {
      mockListingRepo.findOne.mockResolvedValue(null);

      await expect(
        listingService.deleteListing("missing-id", "user123"),
      ).rejects.toThrow("Listing not found");

      expect(mockListingRepo.remove).not.toHaveBeenCalled();
    });

    it("should throw error if user does not own the listing", async () => {
      mockListingRepo.findOne.mockResolvedValue({
        listingId: "listing-1",
        sellerId: "otherUser",
      });

      await expect(
        listingService.deleteListing("listing-1", "user123"),
      ).rejects.toThrow("Unauthorized");

      expect(mockListingRepo.remove).not.toHaveBeenCalled();
    });

    it("should throw error if remove fails", async () => {
      mockListingRepo.findOne.mockResolvedValue({ listingId: "listing-1", sellerId: "user123" });
      mockListingRepo.remove.mockRejectedValue(new Error("Delete failed"));

      await expect(
        listingService.deleteListing("listing-1", "user123"),
      ).rejects.toThrow("Delete failed");
    });
  });

  describe("getListings", () => {
    it("should return listings with default sorting and pagination", async () => {
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ listingId: "1", name: "Desk" }]),
      };

      mockListingRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await listingService.getListings({}, "");

      expect(mockQb.orderBy).toHaveBeenCalledWith("listing.createdAt", "DESC");
      expect(result).toEqual([{ listingId: "1", name: "Desk" }]);
    });

    it("should apply category filter", async () => {
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockListingRepo.createQueryBuilder.mockReturnValue(mockQb);

      await listingService.getListings({ category: "furniture" }, "");

      expect(mockQb.where).toHaveBeenCalledWith("listing.category = :category", { category: "furniture" });
    });

    it("should apply minPrice and maxPrice filters", async () => {
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockListingRepo.createQueryBuilder.mockReturnValue(mockQb);

      await listingService.getListings({ minPrice: 50, maxPrice: 200 }, "");

      expect(mockQb.andWhere).toHaveBeenCalledWith("listing.price >= :minPrice", { minPrice: 50 });
      expect(mockQb.andWhere).toHaveBeenCalledWith("listing.price <= :maxPrice", { maxPrice: 200 });
    });

    it("should apply search filter", async () => {
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockListingRepo.createQueryBuilder.mockReturnValue(mockQb);

      await listingService.getListings({ search: "desk" }, "");

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        "listing.name ILIKE :search OR listing.description ILIKE :search",
        { search: "%desk%" },
      );
    });

    it("should use custom sorting and pagination", async () => {
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockListingRepo.createQueryBuilder.mockReturnValue(mockQb);

      await listingService.getListings({ sortBy: "price", order: "ASC", page: 2, limit: 5 }, "");

      expect(mockQb.orderBy).toHaveBeenCalledWith("listing.price", "ASC");
    });

    it("should throw error if query builder fails", async () => {
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockRejectedValue(new Error("Query failed")),
      };
      mockListingRepo.createQueryBuilder.mockReturnValue(mockQb);

      await expect(listingService.getListings({}, "")).rejects.toThrow("Query failed");
    });
  });

  describe("getListingById", () => {
    it("should return a listing when it exists", async () => {
      const mockListing = {
        listingId: "listing-1",
        sellerId: "user123",
        name: "Desk",
        seller: { name: "Arkar" },
        images: [],
        categories: [{ name: "General" }],
        status: "available",
        pickUpLocation: { name: "Brett Hall" },
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      mockListingRepo.findOne.mockResolvedValue(mockListing);
      mockConversationRepo.count.mockResolvedValue(2);

      const result = await listingService.getListingById("listing-1");

      expect(result.listingId).toBe("listing-1");
      expect(result.cntInterestedUser).toBe(2);
    });

    it("should throw error when listing does not exist", async () => {
      mockListingRepo.findOne.mockResolvedValue(null);

      await expect(listingService.getListingById("missing-id")).rejects.toThrow("Listing not found");
    });

    it("should throw error if findOne fails", async () => {
      mockListingRepo.findOne.mockRejectedValue(new Error("Find failed"));

      await expect(listingService.getListingById("listing-1")).rejects.toThrow("Find failed");
    });
  });

  describe("getMyListings", () => {
    it("should return current user's listings", async () => {
      const mockListings = [
        { listingId: "1", sellerId: "user123", name: "Desk" },
        { listingId: "2", sellerId: "user123", name: "Chair" },
      ];
      mockListingRepo.find.mockResolvedValue(mockListings);

      const result = await listingService.getMyListings("user123");

      expect(mockListingRepo.find).toHaveBeenCalledWith({ where: { sellerId: "user123" } });
      expect(result).toEqual(mockListings);
    });

    it("should return empty array when user has no listings", async () => {
      mockListingRepo.find.mockResolvedValue([]);

      const result = await listingService.getMyListings("user123");

      expect(result).toEqual([]);
    });

    it("should throw error if find fails", async () => {
      mockListingRepo.find.mockRejectedValue(new Error("Find failed"));

      await expect(listingService.getMyListings("user123")).rejects.toThrow("Find failed");
    });
  });

  describe("getListingStatus", () => {
    it("returns status of a listing", async () => {
      mockListingRepo.findOne.mockResolvedValue({
        listingId: "listing-1",
        status: "available",
        sellerMarkedSoldAt: null,
        buyerMarkedReceivedAt: null,
      });

      const result = await listingService.getListingStatus("listing-1");

      expect(result.status).toBe("available");
      expect(result.listingId).toBe("listing-1");
    });

    it("throws 404 if listing not found", async () => {
      mockListingRepo.findOne.mockResolvedValue(null);

      await expect(listingService.getListingStatus("bad-id")).rejects.toThrow("Listing not found");
    });

    it("throws if repository fails", async () => {
      mockListingRepo.findOne.mockRejectedValue(new Error("DB error"));

      await expect(listingService.getListingStatus("listing-1")).rejects.toThrow("DB error");
    });
  });
});