import { Request, Response } from "express";
import {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  getMyListings,
  getListingStatus,
} from "../../src/controllers/listingController";
import * as listingService from "../../src/services/listingService";
import { getUserId } from "../../src/utils/getUserId";
import { AppError } from "../../src/utils/AppError";

jest.mock("../../src/services/listingService");
jest.mock("../../src/utils/getUserId");

describe("listingController", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  describe("createListing", () => {
    it("should call service with body and userId and return 201", async () => {
      req.body = { name: "Desk", price: 120 };

      (getUserId as jest.Mock).mockReturnValue("user123");
      const mockListing = { listingId: "1", name: "Desk", price: 120 };
      (listingService.createListing as jest.Mock).mockResolvedValue(
        mockListing,
      );

      await createListing(req as Request, res as Response, next);

      expect(getUserId).toHaveBeenCalledWith(req);
      expect(listingService.createListing).toHaveBeenCalledWith(
        req.body,
        "user123",
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockListing);
    });

    it("should call next with error if user is unauthorized", async () => {
      req.body = { name: "Desk", price: 120 };

      const error = new AppError("Unauthorized");
      (getUserId as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await createListing(req as Request, res as Response, next);

      expect(getUserId).toHaveBeenCalledWith(req);
      expect(next).toHaveBeenCalledWith(error);
      expect(listingService.createListing).not.toHaveBeenCalled();
    });

    it("should call next(error) if service throws an error", async () => {
      req.body = { name: "Desk", price: 120 };

      (getUserId as jest.Mock).mockReturnValue("user123");
      const error = new Error("Service failed");
      (listingService.createListing as jest.Mock).mockRejectedValue(error);

      await createListing(req as Request, res as Response, next);

      expect(getUserId).toHaveBeenCalledWith(req);
      expect(next).toHaveBeenCalledWith(error);
    });

    it("should not send response if getUserId throws", async () => {
      req.body = { name: "Desk", price: 120 };

      const error = new AppError("Unauthorized");
      (getUserId as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await createListing(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe("getListings", () => {
    it("should return 200 with listings", async () => {
      req.query = { category: "furniture" };

      const mockListings = [
        { listingId: "1", name: "Desk" },
        { listingId: "2", name: "Chair" },
      ];

      (listingService.getListings as jest.Mock).mockResolvedValue(mockListings);

      await getListings(req as Request, res as Response, next);

      expect(listingService.getListings).toHaveBeenCalledWith({
        category: "furniture",
        sortBy: "createdAt",
        order: "DESC",
        page: 1,
        limit: 10,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockListings);
    });

    it("should call next(error) if service throws", async () => {
      const error = new Error("Failed to fetch listings");
      (listingService.getListings as jest.Mock).mockRejectedValue(error);

      await getListings(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("should return 200 with listings when query is empty", async () => {
      req.query = {};

      const mockListings = [{ listingId: "1", name: "Desk" }];
      (listingService.getListings as jest.Mock).mockResolvedValue(mockListings);

      await getListings(req as Request, res as Response, next);

      expect(listingService.getListings).toHaveBeenCalledWith({
        sortBy: "createdAt",
        order: "DESC",
        page: 1,
        limit: 10,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockListings);
    });

    it("should transform query params before calling service", async () => {
      req.query = {
        search: "desk",
        category: "furniture",
        sortBy: "price",
        order: "ASC",
        minPrice: "50",
        maxPrice: "200",
        page: "2",
        limit: "5",
      };

      const mockListings = [{ listingId: "1", name: "Desk" }];
      (listingService.getListings as jest.Mock).mockResolvedValue(mockListings);

      await getListings(req as Request, res as Response, next);

      expect(listingService.getListings).toHaveBeenCalledWith({
        search: "desk",
        category: "furniture",
        sortBy: "price",
        order: "ASC",
        minPrice: 50,
        maxPrice: 200,
        page: 2,
        limit: 5,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockListings);
    });

    it("should omit optional filters when they are not provided", async () => {
      req.query = {
        page: "3",
        limit: "2",
      };

      const mockListings = [{ listingId: "1", name: "Desk" }];
      (listingService.getListings as jest.Mock).mockResolvedValue(mockListings);

      await getListings(req as Request, res as Response, next);

      expect(listingService.getListings).toHaveBeenCalledWith({
        sortBy: "createdAt",
        order: "DESC",
        page: 3,
        limit: 2,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockListings);
    });

    it("should convert only minPrice when maxPrice is not provided", async () => {
      req.query = {
        minPrice: "75",
      };

      const mockListings = [{ listingId: "1", name: "Desk" }];
      (listingService.getListings as jest.Mock).mockResolvedValue(mockListings);

      await getListings(req as Request, res as Response, next);

      expect(listingService.getListings).toHaveBeenCalledWith({
        sortBy: "createdAt",
        order: "DESC",
        page: 1,
        limit: 10,
        minPrice: 75,
      });
    });
  });

  describe("getListingById", () => {
    it("should return 200 with listing when id exists", async () => {
      req.params = { id: "listing-1" };

      const mockListing = { listingId: "listing-1", name: "Desk" };
      (listingService.getListingById as jest.Mock).mockResolvedValue(
        mockListing,
      );

      await getListingById(
        req as Request<{ id: string }>,
        res as Response,
        next,
      );

      expect(listingService.getListingById).toHaveBeenCalledWith("listing-1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockListing);
    });

    it("should call next with AppError when id is missing", async () => {
      req.params = {} as any;

      await getListingById(
        req as Request<{ id: string }>,
        res as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(listingService.getListingById).not.toHaveBeenCalled();
    });

    it("should call next(error) if service throws", async () => {
      req.params = { id: "listing-1" };

      const error = new Error("Listing not found");
      (listingService.getListingById as jest.Mock).mockRejectedValue(error);

      await getListingById(
        req as Request<{ id: string }>,
        res as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(error);
    });

    it("should not send response when id is missing", async () => {
      req.params = {} as any;

      await getListingById(
        req as Request<{ id: string }>,
        res as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe("updateListing", () => {
    it("should call service and return 200 when update succeeds", async () => {
      req.params = { id: "listing-1" };
      req.body = { name: "Updated Desk" };

      (getUserId as jest.Mock).mockReturnValue("user123");

      const updatedListing = {
        listingId: "listing-1",
        sellerId: "user123",
        name: "Updated Desk",
      };

      (listingService.updateListing as jest.Mock).mockResolvedValue(
        updatedListing,
      );

      await updateListing(
        req as Request<{ id: string }>,
        res as Response,
        next,
      );

      expect(getUserId).toHaveBeenCalledWith(req);
      expect(listingService.updateListing).toHaveBeenCalledWith(
        "listing-1",
        req.body,
        "user123",
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedListing);
    });

    it("should call next with AppError when id is missing", async () => {
      req.params = {} as any;
      req.body = { name: "Updated Desk" };

      await updateListing(
        req as Request<{ id: string }>,
        res as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(listingService.updateListing).not.toHaveBeenCalled();
    });

    it("should call next(error) if service throws", async () => {
      req.params = { id: "listing-1" };
      req.body = { name: "Updated Desk" };

      (getUserId as jest.Mock).mockReturnValue("user123");
      const error = new Error("Unauthorized");
      (listingService.updateListing as jest.Mock).mockRejectedValue(error);

      await updateListing(
        req as Request<{ id: string }>,
        res as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(error);
    });

    it("should not call getUserId when update id is missing", async () => {
      req.params = {} as any;
      req.body = { name: "Updated Desk" };

      await updateListing(
        req as Request<{ id: string }>,
        res as Response,
        next,
      );

      expect(getUserId).not.toHaveBeenCalled();
      expect(listingService.updateListing).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it("should not send response if update service throws", async () => {
      req.params = { id: "listing-1" };
      req.body = { name: "Updated Desk" };

      (getUserId as jest.Mock).mockReturnValue("user123");
      const error = new Error("Unauthorized");
      (listingService.updateListing as jest.Mock).mockRejectedValue(error);

      await updateListing(
        req as Request<{ id: string }>,
        res as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe("deleteListing", () => {
    it("should call service and return 204 when delete succeeds", async () => {
      req.params = { id: "listing-1" };

      (getUserId as jest.Mock).mockReturnValue("user123");
      (listingService.deleteListing as jest.Mock).mockResolvedValue({
        message: "Listing deleted successfully",
      });

      await deleteListing(
        req as Request<{ id: string }>,
        res as Response,
        next,
      );

      expect(getUserId).toHaveBeenCalledWith(req);
      expect(listingService.deleteListing).toHaveBeenCalledWith(
        "listing-1",
        "user123",
      );
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it("should call next with AppError when id is missing", async () => {
      req.params = {} as any;

      await deleteListing(
        req as Request<{ id: string }>,
        res as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(listingService.deleteListing).not.toHaveBeenCalled();
    });

    it("should call next(error) if service throws", async () => {
      req.params = { id: "listing-1" };

      (getUserId as jest.Mock).mockReturnValue("user123");
      const error = new Error("Listing not found");
      (listingService.deleteListing as jest.Mock).mockRejectedValue(error);

      await deleteListing(
        req as Request<{ id: string }>,
        res as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(error);
    });

    it("should not call getUserId when delete id is missing", async () => {
      req.params = {} as any;

      await deleteListing(
        req as Request<{ id: string }>,
        res as Response,
        next,
      );

      expect(getUserId).not.toHaveBeenCalled();
      expect(listingService.deleteListing).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it("should not send response if delete service throws", async () => {
      req.params = { id: "listing-1" };

      (getUserId as jest.Mock).mockReturnValue("user123");
      const error = new Error("Listing not found");
      (listingService.deleteListing as jest.Mock).mockRejectedValue(error);

      await deleteListing(
        req as Request<{ id: string }>,
        res as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe("getMyListings", () => {
    it("should return 200 with current user's listings", async () => {
      (getUserId as jest.Mock).mockReturnValue("user123");

      const mockListings = [
        { listingId: "1", sellerId: "user123", name: "Desk" },
        { listingId: "2", sellerId: "user123", name: "Chair" },
      ];

      (listingService.getMyListings as jest.Mock).mockResolvedValue(
        mockListings,
      );

      await getMyListings(req as Request, res as Response, next);

      expect(getUserId).toHaveBeenCalledWith(req);
      expect(listingService.getMyListings).toHaveBeenCalledWith("user123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockListings);
    });

    it("should call next(error) if getUserId throws", async () => {
      const error = new AppError("Unauthorized");
      (getUserId as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await getMyListings(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(listingService.getMyListings).not.toHaveBeenCalled();
    });

    it("should call next(error) if service throws", async () => {
      (getUserId as jest.Mock).mockReturnValue("user123");
      const error = new Error("Failed to fetch my listings");
      (listingService.getMyListings as jest.Mock).mockRejectedValue(error);

      await getMyListings(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("should return 200 with empty array when user has no listings", async () => {
      (getUserId as jest.Mock).mockReturnValue("user123");
      (listingService.getMyListings as jest.Mock).mockResolvedValue([]);

      await getMyListings(req as Request, res as Response, next);

      expect(getUserId).toHaveBeenCalledWith(req);
      expect(listingService.getMyListings).toHaveBeenCalledWith("user123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it("should not send response if getMyListings service throws", async () => {
      (getUserId as jest.Mock).mockReturnValue("user123");
      const error = new Error("Failed to fetch my listings");
      (listingService.getMyListings as jest.Mock).mockRejectedValue(error);

      await getMyListings(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe("getListingStatus", () => {
    it("returns 200 and status on success", async () => {
      req.params = { id: "listing-1" };

      (listingService.getListingStatus as jest.Mock).mockResolvedValue({
        listingId: "listing-1",
        status: "available",
        sellerMarkedSoldAt: null,
        buyerMarkedReceivedAt: null,
      });

      await getListingStatus(
        req as Request<{ id: string }>,
        res as Response,
        next,
      );

      expect(listingService.getListingStatus).toHaveBeenCalledWith("listing-1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: "available" }),
      );
    });

    it("calls next with 404 when listing not found", async () => {
      req.params = { id: "bad-id" };

      (listingService.getListingStatus as jest.Mock).mockRejectedValue(
        new AppError("Listing not found", 404),
      );

      await getListingStatus(
        req as Request<{ id: string }>,
        res as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it("calls next with error when service throws", async () => {
      req.params = { id: "listing-1" };

      (listingService.getListingStatus as jest.Mock).mockRejectedValue(
        new Error("DB error"),
      );

      await getListingStatus(
        req as Request<{ id: string }>,
        res as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
