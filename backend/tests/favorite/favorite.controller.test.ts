import { Request, Response } from "express";
import * as favoriteService from "../../src/services/favoriteService";
import {
  addFavorite,
  getMyFavorites,
  removeFavorite,
} from "../../src/controllers/favoriteController";

jest.mock("../../src/services/favoriteService");
jest.mock("../../src/utils/getUserId", () => ({
  getUserId: jest.fn(() => "user-123"),
}));

const flushPromises = () => new Promise(process.nextTick);

describe("favoriteController", () => {
  let mockReq: Partial<Request<{ listingId: string }>>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = { params: { listingId: "" }, body: {} };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe("addFavorite", () => {
    it("returns 201 and json response when addFavorite succeeds", async () => {
      const serviceResult = {
        message: "Listing favorited successfully",
        favorite: {
          id: "fav-1",
          userId: "user-123",
          listingId: "listing-123",
        },
      };

      mockReq.params = { listingId: "listing-123" };
      (favoriteService.addFavorite as jest.Mock).mockResolvedValue(serviceResult);

      addFavorite(mockReq as Request<{ listingId: string }>, mockRes as Response, mockNext);
      await flushPromises();

      expect(favoriteService.addFavorite).toHaveBeenCalledWith("user-123", "listing-123");
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(serviceResult);
    });

    it("calls next(error) when addFavorite fails", async () => {
      const error = new Error("Add favorite failed");
      mockReq.params = { listingId: "listing-123" };
      (favoriteService.addFavorite as jest.Mock).mockRejectedValue(error);

      addFavorite(mockReq as Request<{ listingId: string }>, mockRes as Response, mockNext);
      await flushPromises();

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getMyFavorites", () => {
    it("returns 200 and json response when getMyFavorites succeeds", async () => {
      const serviceResult = [
        { listingId: "listing-1", name: "Cap" },
        { listingId: "listing-2", name: "Bike" },
      ];

      (favoriteService.getMyFavorites as jest.Mock).mockResolvedValue(serviceResult);

      getMyFavorites(mockReq as Request<{ listingId: string }>, mockRes as Response, mockNext);
      await flushPromises();

      expect(favoriteService.getMyFavorites).toHaveBeenCalledWith("user-123");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(serviceResult);
    });

    it("calls next(error) when getMyFavorites fails", async () => {
      const error = new Error("Get favorites failed");
      (favoriteService.getMyFavorites as jest.Mock).mockRejectedValue(error);

      getMyFavorites(mockReq as Request<{ listingId: string }>, mockRes as Response, mockNext);
      await flushPromises();

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("removeFavorite", () => {
    it("returns 204 when removeFavorite succeeds", async () => {
      mockReq.params = { listingId: "listing-123" };
      (favoriteService.removeFavorite as jest.Mock).mockResolvedValue({
        message: "Favorite removed successfully",
      });

      removeFavorite(mockReq as Request<{ listingId: string }>, mockRes as Response, mockNext);
      await flushPromises();

      expect(favoriteService.removeFavorite).toHaveBeenCalledWith("user-123", "listing-123");
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it("calls next(error) when removeFavorite fails", async () => {
      const error = new Error("Remove favorite failed");
      mockReq.params = { listingId: "listing-123" };
      (favoriteService.removeFavorite as jest.Mock).mockRejectedValue(error);

      removeFavorite(mockReq as Request<{ listingId: string }>, mockRes as Response, mockNext);
      await flushPromises();

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});