import * as listingService from "../../src/services/listingService";
import { AppDataSource } from "../../src/config/data-source";
import { Listing } from "../../src/entities/Listing";
import { Conversation } from "../../src/entities/Conversation";

// ✅ Mock DataSource (NOT entity)
jest.mock("../../src/config/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn(), // mock getRepository so we control repo behavior
  },
}));

describe("listingService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createListing", () => {
    it("should sucessfully create and return a listing", async () => {
      const mockInput: Partial<Listing> = { name: "Table" };

      const mockCreatedListing: any = {
        name: "Table",
      };

      const mockSavedListing = {
        id: "1",
        name: "Table",
        sellerId: "user123",
      };

      const mockRepo = {
        create: jest.fn().mockReturnValue(mockCreatedListing), // simulate create()
        save: jest.fn().mockResolvedValue(mockSavedListing), // simulate save()
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      const result = await listingService.createListing(mockInput, "user123");

      expect(AppDataSource.getRepository).toHaveBeenCalledWith(Listing); // repo requested
      expect(mockRepo.create).toHaveBeenCalledWith(mockInput); // create called
      expect(mockCreatedListing.sellerId).toBe("user123"); // seller attached
      expect(mockRepo.save).toHaveBeenCalledWith(mockCreatedListing); // save called
      expect(result).toEqual(mockSavedListing); // correct return
    });

    it("should overwrite incoming sellerId with authenticated userId", async () => {
      const mockCreatedListing: any = {
        name: "Desk",
        sellerId: "bad-user",
      };

      const mockRepo = {
        create: jest.fn().mockReturnValue(mockCreatedListing),
        save: jest.fn().mockImplementation(async (listing) => listing),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      const result = await listingService.createListing(
        { name: "Desk", sellerId: "bad-user" } as Partial<Listing>,
        "user123",
      );

      expect(result.sellerId).toBe("user123");
    });

    it("should throw error if repository is not found", async () => {
      (AppDataSource.getRepository as jest.Mock).mockImplementation(() => {
        throw new Error("Repo not found");
      });

      await expect(
        listingService.createListing({ name: "Test" }, "user123"),
      ).rejects.toThrow("Repo not found");
      // ✅ FIX: call service FIRST → triggers getRepository()

      expect(AppDataSource.getRepository).toHaveBeenCalledWith(Listing);
      // ✅ FIX: moved AFTER service call so Jest sees the call
    });

    it("should throw error if create fails", async () => {
      const mockRepo = {
        create: jest.fn(() => {
          throw new Error("Create failed"); // simulate failure in create()
        }),
        save: jest.fn(),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      await expect(
        listingService.createListing({ name: "Test" }, "user123"),
      ).rejects.toThrow("Create failed");
      // ✅ FIX: call service FIRST so create() is actually triggered

      expect(AppDataSource.getRepository).toHaveBeenCalledWith(Listing);
      // ✅ FIX: moved AFTER service call

      expect(mockRepo.save).not.toHaveBeenCalled();
      // ensures save() is NOT called if create() fails
    });

    it("should throw error if save fails", async () => {
      const mockRepo = {
        create: jest.fn().mockReturnValue({ name: "Test" }),
        save: jest.fn().mockRejectedValue(new Error("Save failed")), // simulate save failure
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      await expect(
        listingService.createListing({ name: "Test" }, "user123"),
      ).rejects.toThrow("Save failed");
    });

    it("should save two listings sequentially", async () => {
      const mockRepo = {
        create: jest
          .fn()
          .mockReturnValueOnce({ name: "Textbook 320" })
          .mockReturnValueOnce({ name: "Wooden chair" }),

        save: jest
          .fn()
          .mockResolvedValueOnce({
            id: "1",
            name: "Textbook 320",
            sellerId: "user123",
          })
          .mockResolvedValueOnce({
            id: "2",
            name: "Wooden chair",
            sellerId: "user234",
          }),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      const result1 = await listingService.createListing(
        { name: "Textbook 320" },
        "user123",
      );

      expect(mockRepo.create).toHaveBeenNthCalledWith(1, {
        name: "Textbook 320",
      });

      const result2 = await listingService.createListing(
        { name: "Wooden chair" },
        "user234",
      );

      expect(mockRepo.create).toHaveBeenNthCalledWith(2, {
        name: "Wooden chair",
      });

      expect(mockRepo.create).toHaveBeenCalledTimes(2);
      expect(mockRepo.save).toHaveBeenCalledTimes(2);

      expect(result1).toEqual({
        id: "1",
        name: "Textbook 320",
        sellerId: "user123",
      });

      expect(result2).toEqual({
        id: "2",
        name: "Wooden chair",
        sellerId: "user234",
      });
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

      const savedListing = {
        ...existingListing,
        name: "New Desk",
        price: 150,
      };

      const mockRepo = {
        findOne: jest.fn().mockResolvedValue(existingListing),
        save: jest.fn().mockResolvedValue(savedListing),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      const result = await listingService.updateListing(
        "listing-1",
        { name: "New Desk", price: 150 },
        "user123",
      );

      expect(AppDataSource.getRepository).toHaveBeenCalledWith(Listing);
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { listingId: "listing-1" },
      });
      expect(mockRepo.save).toHaveBeenCalledWith({
        ...existingListing,
        name: "New Desk",
        price: 150,
      });
      expect(result).toEqual(savedListing);
    });

    it("should throw error if listing does not exist", async () => {
      const mockRepo = {
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn(),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      await expect(
        listingService.updateListing("missing-id", { name: "Desk" }, "user123"),
      ).rejects.toThrow("Listing not found");

      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it("should throw error if user does not own the listing", async () => {
      const mockRepo = {
        findOne: jest.fn().mockResolvedValue({
          listingId: "listing-1",
          sellerId: "otherUser",
          name: "Desk",
        }),
        save: jest.fn(),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      await expect(
        listingService.updateListing(
          "listing-1",
          { name: "New Name" },
          "user123",
        ),
      ).rejects.toThrow("Unauthorized");

      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it("should not allow sellerId or listingId to be overwritten", async () => {
      const existingListing = {
        listingId: "listing-1",
        sellerId: "user123",
        name: "Desk",
        price: 100,
      };

      const mockRepo = {
        findOne: jest.fn().mockResolvedValue(existingListing),
        save: jest.fn().mockImplementation(async (listing) => listing),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      const result = await listingService.updateListing(
        "listing-1",
        {
          name: "Updated Desk",
          sellerId: "hacker",
          listingId: "fake-id",
        } as Partial<Listing>,
        "user123",
      );

      expect(result.sellerId).toBe("user123");
      expect(result.listingId).toBe("listing-1");
      expect(result.name).toBe("Updated Desk");
    });
  });

  describe("deleteListing", () => {
    it("should delete a listing successfully", async () => {
      const existingListing = {
        listingId: "listing-1",
        sellerId: "user123",
        name: "Desk",
      };

      const mockRepo = {
        findOne: jest.fn().mockResolvedValue(existingListing),
        remove: jest.fn().mockResolvedValue(existingListing),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      const result = await listingService.deleteListing("listing-1", "user123");

      expect(AppDataSource.getRepository).toHaveBeenCalledWith(Listing);
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { listingId: "listing-1" },
      });
      expect(mockRepo.remove).toHaveBeenCalledWith(existingListing);
      expect(result).toEqual({ message: "Listing deleted successfully" });
    });

    it("should throw error if listing does not exist", async () => {
      const mockRepo = {
        findOne: jest.fn().mockResolvedValue(null),
        remove: jest.fn(),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      await expect(
        listingService.deleteListing("missing-id", "user123"),
      ).rejects.toThrow("Listing not found");

      expect(mockRepo.remove).not.toHaveBeenCalled();
    });

    it("should throw error if user does not own the listing", async () => {
      const mockRepo = {
        findOne: jest.fn().mockResolvedValue({
          listingId: "listing-1",
          sellerId: "otherUser",
        }),
        remove: jest.fn(),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      await expect(
        listingService.deleteListing("listing-1", "user123"),
      ).rejects.toThrow("Unauthorized");

      expect(mockRepo.remove).not.toHaveBeenCalled();
    });

    it("should throw error if remove fails", async () => {
      const existingListing = {
        listingId: "listing-1",
        sellerId: "user123",
      };

      const mockRepo = {
        findOne: jest.fn().mockResolvedValue(existingListing),
        remove: jest.fn().mockRejectedValue(new Error("Delete failed")),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      await expect(
        listingService.deleteListing("listing-1", "user123"),
      ).rejects.toThrow("Delete failed");
    });
  });
  describe("getListings", () => {
    it("should return listings with default sorting and pagination", async () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([{ listingId: "1", name: "Desk" }]),
      };

      const mockRepo = {
        createQueryBuilder: jest.fn().mockReturnValue(mockQb),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      const result = await listingService.getListings({});

      expect(AppDataSource.getRepository).toHaveBeenCalledWith(Listing);
      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith("listing");
      expect(mockQb.orderBy).toHaveBeenCalledWith("listing.createdAt", "DESC");
      expect(mockQb.skip).toHaveBeenCalledWith(0);
      expect(mockQb.take).toHaveBeenCalledWith(10);
      expect(result).toEqual([{ listingId: "1", name: "Desk" }]);
    });

    it("should apply category filter", async () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      const mockRepo = {
        createQueryBuilder: jest.fn().mockReturnValue(mockQb),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      await listingService.getListings({ category: "furniture" });

      expect(mockQb.where).toHaveBeenCalledWith(
        "listing.category = :category",
        { category: "furniture" },
      );
    });

    it("should apply minPrice and maxPrice filters", async () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      const mockRepo = {
        createQueryBuilder: jest.fn().mockReturnValue(mockQb),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      await listingService.getListings({ minPrice: 50, maxPrice: 200 });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        "listing.price >= :minPrice",
        { minPrice: 50 },
      );
      expect(mockQb.andWhere).toHaveBeenCalledWith(
        "listing.price <= :maxPrice",
        { maxPrice: 200 },
      );
    });

    it("should apply search filter", async () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      const mockRepo = {
        createQueryBuilder: jest.fn().mockReturnValue(mockQb),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      await listingService.getListings({ search: "desk" });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        "listing.name ILIKE :search OR listing.description ILIKE :search",
        { search: "%desk%" },
      );
    });

    it("should use custom sorting and pagination", async () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      const mockRepo = {
        createQueryBuilder: jest.fn().mockReturnValue(mockQb),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      await listingService.getListings({
        sortBy: "price",
        order: "ASC",
        page: 2,
        limit: 5,
      });

      expect(mockQb.orderBy).toHaveBeenCalledWith("listing.price", "ASC");
      expect(mockQb.skip).toHaveBeenCalledWith(5);
      expect(mockQb.take).toHaveBeenCalledWith(5);
    });

    it("should throw error if query builder fails", async () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockRejectedValue(new Error("Query failed")),
      };

      const mockRepo = {
        createQueryBuilder: jest.fn().mockReturnValue(mockQb),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      await expect(listingService.getListings({})).rejects.toThrow(
        "Query failed",
      );
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
        categories: [],
        status: "available",
        pickUpLocation: "Brett Hall",
        updatedAt: new Date(),
      };

      const mockListingRepo = {
        findOne: jest.fn().mockResolvedValue(mockListing),
      };

      const mockConversationRepo = {
        count: jest.fn().mockResolvedValue(2),
      };

      (AppDataSource.getRepository as jest.Mock).mockImplementation(
        (entity) => {
          if (entity === Listing) return mockListingRepo;
          return mockConversationRepo;
        },
      );

      const result = await listingService.getListingById("listing-1");

      expect(result.listingId).toBe("listing-1");
      expect(result.cntInterestedUser).toBe(2);
    });

    it("should throw error when listing does not exist", async () => {
      const mockListingRepo = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      (AppDataSource.getRepository as jest.Mock).mockImplementation(
        (entity) => {
          if (entity === Listing) return mockListingRepo;
          return { count: jest.fn().mockResolvedValue(0) };
        },
      );

      await expect(listingService.getListingById("missing-id")).rejects.toThrow(
        "Listing not found",
      );
    });

    it("should throw error if findOne fails", async () => {
      const mockListingRepo = {
        findOne: jest.fn().mockRejectedValue(new Error("Find failed")),
      };

      (AppDataSource.getRepository as jest.Mock).mockImplementation(
        (entity) => {
          if (entity === Listing) return mockListingRepo;
          return { count: jest.fn().mockResolvedValue(0) };
        },
      );

      await expect(listingService.getListingById("listing-1")).rejects.toThrow(
        "Find failed",
      );
    });
  });

  describe("getMyListings", () => {
    it("should return current user's listings", async () => {
      const mockListings = [
        { listingId: "1", sellerId: "user123", name: "Desk" },
        { listingId: "2", sellerId: "user123", name: "Chair" },
      ];

      const mockRepo = {
        find: jest.fn().mockResolvedValue(mockListings),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      const result = await listingService.getMyListings("user123");

      expect(AppDataSource.getRepository).toHaveBeenCalledWith(Listing);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { sellerId: "user123" },
      });
      expect(result).toEqual(mockListings);
    });

    it("should return empty array when user has no listings", async () => {
      const mockRepo = {
        find: jest.fn().mockResolvedValue([]),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      const result = await listingService.getMyListings("user123");

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { sellerId: "user123" },
      });
      expect(result).toEqual([]);
    });

    it("should throw error if find fails", async () => {
      const mockRepo = {
        find: jest.fn().mockRejectedValue(new Error("Find failed")),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      await expect(listingService.getMyListings("user123")).rejects.toThrow(
        "Find failed",
      );
    });
  });

  describe("getListingStatus", () => {
    it("returns status of a listing", async () => {
      const mockListing = {
        listingId: "listing-1",
        status: "available",
        sellerMarkedSoldAt: null,
        buyerMarkedReceivedAt: null,
      };

      const mockRepo = {
        findOne: jest.fn().mockResolvedValue(mockListing),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      const result = await listingService.getListingStatus("listing-1");

      expect(result.status).toBe("available");
      expect(result.listingId).toBe("listing-1");
    });

    it("throws 404 if listing not found", async () => {
      const mockRepo = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      await expect(listingService.getListingStatus("bad-id")).rejects.toThrow(
        "Listing not found",
      );
    });

    it("throws if repository fails", async () => {
      const mockRepo = {
        findOne: jest.fn().mockRejectedValue(new Error("DB error")),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      await expect(
        listingService.getListingStatus("listing-1"),
      ).rejects.toThrow("DB error");
    });
  });
});
