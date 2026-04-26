import { Request, Response, NextFunction } from "express";
import * as pickUpLocationController from "../../src/controllers/pickUpLocationController";
import * as pickUpLocationService from "../../src/services/pickUpLocationService";
import { AppError } from "../../src/utils/AppError";

jest.mock("../../src/services/pickUpLocationService");

const flushPromises = () => new Promise(process.nextTick);

describe("pickUpLocationController", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = { body: {}, params: {} as any };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("createPickUpLocation", () => {
    it("returns 201 and created location on success", async () => {
      mockReq.body = { name: "Orchard Hill" };
      (pickUpLocationService.createPickUpLocation as jest.Mock).mockResolvedValue({
        locationId: "uuid-1",
        name: "Orchard Hill",
      });

      pickUpLocationController.createPickUpLocation(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );
      await flushPromises();

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ locationId: "uuid-1", name: "Orchard Hill" });
    });

    it("calls next with 400 AppError when name is missing", async () => {
      mockReq.body = {};

      pickUpLocationController.createPickUpLocation(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );
      await flushPromises();

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe("Name is required");
    });

    it("calls next with error when service throws", async () => {
      mockReq.body = { name: "Orchard Hill" };
      (pickUpLocationService.createPickUpLocation as jest.Mock).mockRejectedValue(
        new AppError("Pick up location already exists", 409)
      );

      pickUpLocationController.createPickUpLocation(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );
      await flushPromises();

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.message).toBe("Pick up location already exists");
    });
  });
});