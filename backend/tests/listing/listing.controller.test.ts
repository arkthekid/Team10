import { Request, Response, NextFunction } from "express";
import { createListing } from "../../src/controllers/listingController";
import * as listingService from "../../src/services/listingService";
import { getUserId } from "../../src/utils/getUserId";
import { AppError } from "../../src/utils/AppError";

// Mock dependencies
jest.mock("../../../src/services/listingService");
jest.mock("../../../src/utils/getUserId");

describe("createListing controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      body: { title: "Test Listing" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  it("should call service with body and userId and return 201", async () => {
    (getUserId as jest.Mock).mockReturnValue("user123");
    const mockListing = { _id: "1", title: "Test Listing" };
    (listingService.createListing as jest.Mock).mockResolvedValue(mockListing); // mock return values for service

    await createListing(req as Request, res as Response, next);

    // check that createListing controller is working
    expect(getUserId).toHaveBeenCalledWith(req); // getUserID is called
    expect(listingService.createListing).toHaveBeenCalledWith(req.body, "user123"); // createListing service is called
    expect(res.status).toHaveBeenCalledWith(201); // response status is 201
    expect(res.json).toHaveBeenCalledWith(mockListing); // response body matches
  });

  it("should call next with error if user is unauthorized", async () => {
    const error = new AppError("Unauthorized");
    (getUserId as jest.Mock).mockImplementation(() => {throw error;});

    await createListing(req as Request, res as Response, next);

    expect(getUserId).toHaveBeenCalledWith(req); // getUserID is called
    expect(next).toHaveBeenCalledWith(error); // next(Error) is called
    expect(listingService.createListing).not.toHaveBeenCalled(); // service is not called
});

  it("should call next(error) if service throws an error", async () => {
    (getUserId as jest.Mock).mockReturnValue("user123");
    const error = new Error("Service failed");
    (listingService.createListing as jest.Mock).mockRejectedValue(error);

    await createListing(req as Request, res as Response, next);

    expect(getUserId).toHaveBeenCalledWith(req); // getUserID is called
    expect(next).toHaveBeenCalledWith(error); // next(error) is called
  });
});