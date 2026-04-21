import * as favoriteService from "../../src/services/favoriteService";
import { AppDataSource } from "../../src/config/data-source";
import { AppError } from "../../src/utils/AppError";

jest.mock("../../src/config/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe("favoriteService", () => {
  const mockFavoriteRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockListingRepo = {
    findOne: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity: any) => {
      if (entity?.name === "Favorite") return mockFavoriteRepo;
      if (entity?.name === "Listing") return mockListingRepo;
      return null;
    });
  });

  describe("addFavorite", () => {
    it("favorites a listing successfully", async () => {
      mockListingRepo.findOne.mockResolvedValue({
        listingId: "listing-123",
        name: "Cap",
      });

      mockFavoriteRepo.findOne.mockResolvedValue(null);
      mockFavoriteRepo.create.mockImplementation((data) => ({
        id: "fav-1",
        ...data,
      }));
      mockFavoriteRepo.save.mockResolvedValue(undefined);

      const result = await favoriteService.addFavorite("user-123", "listing-123");

      expect(result.message).toMatch(/favorited/i);
      expect(result.favorite.userId).toBe("user-123");
      expect(result.favorite.listingId).toBe("listing-123");
      expect(mockListingRepo.findOne).toHaveBeenCalledWith({
        where: { listingId: "listing-123" },
      });
      expect(mockFavoriteRepo.findOne).toHaveBeenCalledWith({
        where: { userId: "user-123", listingId: "listing-123" },
      });
      expect(mockFavoriteRepo.create).toHaveBeenCalled();
      expect(mockFavoriteRepo.save).toHaveBeenCalled();
    });

    it("rejects unknown listing", async () => {
      mockListingRepo.findOne.mockResolvedValue(null);

      await expect(
        favoriteService.addFavorite("user-123", "listing-123")
      ).rejects.toThrow("Listing not found");
    });

    it("rejects duplicate favorite", async () => {
      mockListingRepo.findOne.mockResolvedValue({
        listingId: "listing-123",
      });

      mockFavoriteRepo.findOne.mockResolvedValue({
        id: "fav-1",
        userId: "user-123",
        listingId: "listing-123",
      });

      await expect(
        favoriteService.addFavorite("user-123", "listing-123")
      ).rejects.toThrow("Listing is already in favorites");
    });
  });

  describe("getMyFavorites", () => {
    it("returns the current user's favorited listings", async () => {
      mockFavoriteRepo.find.mockResolvedValue([
        {
          id: "fav-1",
          createdAt: new Date(),
          listing: { listingId: "listing-1", name: "Cap" },
        },
        {
          id: "fav-2",
          createdAt: new Date(),
          listing: { listingId: "listing-2", name: "Bike" },
        },
      ]);

      const result = await favoriteService.getMyFavorites("user-123");

      expect(mockFavoriteRepo.find).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        relations: ["listing"],
        order: { createdAt: "DESC" },
      });
      expect(result).toEqual([
        { listingId: "listing-1", name: "Cap" },
        { listingId: "listing-2", name: "Bike" },
      ]);
    });

    it("returns an empty array when user has no favorites", async () => {
      mockFavoriteRepo.find.mockResolvedValue([]);

      const result = await favoriteService.getMyFavorites("user-123");

      expect(result).toEqual([]);
    });
  });

  describe("removeFavorite", () => {
    it("removes a favorite successfully", async () => {
      mockFavoriteRepo.findOne.mockResolvedValue({
        id: "fav-1",
        userId: "user-123",
        listingId: "listing-123",
      });

      mockFavoriteRepo.remove.mockResolvedValue(undefined);

      const result = await favoriteService.removeFavorite("user-123", "listing-123");

      expect(mockFavoriteRepo.findOne).toHaveBeenCalledWith({
        where: { userId: "user-123", listingId: "listing-123" },
      });
      expect(mockFavoriteRepo.remove).toHaveBeenCalled();
      expect(result.message).toMatch(/removed/i);
    });

    it("rejects missing favorite", async () => {
      mockFavoriteRepo.findOne.mockResolvedValue(null);

      await expect(
        favoriteService.removeFavorite("user-123", "listing-123")
      ).rejects.toThrow(AppError);
      await expect(
        favoriteService.removeFavorite("user-123", "listing-123")
      ).rejects.toThrow("Favorite not found");
    });
  });
});