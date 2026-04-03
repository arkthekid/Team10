import * as listingService from "../../src/services/listingService";
import { AppDataSource } from "../../src/config/data-source";
import { Listing } from "../../src/entities/Listing";

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
});