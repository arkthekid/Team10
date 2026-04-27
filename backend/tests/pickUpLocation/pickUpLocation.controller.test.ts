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
      (
        pickUpLocationService.createPickUpLocation as jest.Mock
      ).mockResolvedValue({
        locationId: "uuid-1",
        name: "Orchard Hill",
      });

      pickUpLocationController.createPickUpLocation(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );
      await flushPromises();

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        locationId: "uuid-1",
        name: "Orchard Hill",
      });
    });

    it("calls next with 400 AppError when name is missing", async () => {
      mockReq.body = {};

      pickUpLocationController.createPickUpLocation(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );
      await flushPromises();

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe("Name is required");
    });

    it("calls next with error when service throws", async () => {
      mockReq.body = { name: "Orchard Hill" };
      (
        pickUpLocationService.createPickUpLocation as jest.Mock
      ).mockRejectedValue(new AppError("Pick up location already exists", 409));

      pickUpLocationController.createPickUpLocation(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );
      await flushPromises();

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.message).toBe("Pick up location already exists");
    });
  });

  describe("getAllPickUpLocations", () => {
    it("returns 200 and all locations on success", async () => {
      (
        pickUpLocationService.getAllPickUpLocations as jest.Mock
      ).mockResolvedValue([
        { locationId: "uuid-1", name: "Orchard Hill" },
        { locationId: "uuid-2", name: "Student Union" },
      ]);

      pickUpLocationController.getAllPickUpLocations(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );
      await flushPromises();

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([
        { locationId: "uuid-1", name: "Orchard Hill" },
        { locationId: "uuid-2", name: "Student Union" },
      ]);
    });

    it("returns 200 and empty array when no locations exist", async () => {
      (
        pickUpLocationService.getAllPickUpLocations as jest.Mock
      ).mockResolvedValue([]);

      pickUpLocationController.getAllPickUpLocations(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );
      await flushPromises();

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    it("calls next with error when service throws", async () => {
      (
        pickUpLocationService.getAllPickUpLocations as jest.Mock
      ).mockRejectedValue(new Error("DB error"));

      pickUpLocationController.getAllPickUpLocations(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );
      await flushPromises();

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getPickUpLocationById", () => {
    it("returns 200 and location on success", async () => {
      mockReq.params = { id: "uuid-1" } as any;
      (pickUpLocationService.getPickUpLocationById as jest.Mock).mockResolvedValue({
        locationId: "uuid-1",
        name: "Orchard Hill",
      });

      pickUpLocationController.getPickUpLocationById(
        mockReq as any,
        mockRes as Response,
        mockNext
      );
      await flushPromises();

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ locationId: "uuid-1", name: "Orchard Hill" });
    });

    it("calls next with 404 error when location not found", async () => {
      mockReq.params = { id: "uuid-1" } as any;
      (pickUpLocationService.getPickUpLocationById as jest.Mock).mockRejectedValue(
        new AppError("Pick up location not found", 404)
      );

      pickUpLocationController.getPickUpLocationById(
        mockReq as any,
        mockRes as Response,
        mockNext
      );
      await flushPromises();

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.message).toBe("Pick up location not found");
    });

    it("calls next with error when service throws", async () => {
      mockReq.params = { id: "uuid-1" } as any;
      (pickUpLocationService.getPickUpLocationById as jest.Mock).mockRejectedValue(
        new Error("DB error")
      );

      pickUpLocationController.getPickUpLocationById(
        mockReq as any,
        mockRes as Response,
        mockNext
      );
      await flushPromises();

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("updatePickUpLocation", () => {
    it("returns 200 and updated location on success", async () => {
      mockReq.params = { id: "uuid-1" } as any;
      mockReq.body = { name: "Updated Name" };
      (pickUpLocationService.updatePickUpLocation as jest.Mock).mockResolvedValue({
        locationId: "uuid-1",
        name: "Updated Name",
      });

      pickUpLocationController.updatePickUpLocation(
        mockReq as any,
        mockRes as Response,
        mockNext
      );
      await flushPromises();

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ locationId: "uuid-1", name: "Updated Name" });
    });

    it("calls next with 400 AppError when name is missing", async () => {
      mockReq.params = { id: "uuid-1" } as any;
      mockReq.body = {};

      pickUpLocationController.updatePickUpLocation(
        mockReq as any,
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
      mockReq.params = { id: "uuid-1" } as any;
      mockReq.body = { name: "Updated Name" };
      (pickUpLocationService.updatePickUpLocation as jest.Mock).mockRejectedValue(
        new AppError("Pick up location not found", 404)
      );

      pickUpLocationController.updatePickUpLocation(
        mockReq as any,
        mockRes as Response,
        mockNext
      );
      await flushPromises();

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.message).toBe("Pick up location not found");
    });
  });

    describe("deletePickUpLocation", () => {
    it("returns 200 and success message on success", async () => {
      mockReq.params = { id: "uuid-1" } as any;
      (pickUpLocationService.deletePickUpLocation as jest.Mock).mockResolvedValue({
        message: "Pick up location deleted successfully",
      });

      pickUpLocationController.deletePickUpLocation(
        mockReq as any,
        mockRes as Response,
        mockNext
      );
      await flushPromises();

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Pick up location deleted successfully",
      });
    });

    it("calls next with 404 error when location not found", async () => {
      mockReq.params = { id: "uuid-1" } as any;
      (pickUpLocationService.deletePickUpLocation as jest.Mock).mockRejectedValue(
        new AppError("Pick up location not found", 404)
      );

      pickUpLocationController.deletePickUpLocation(
        mockReq as any,
        mockRes as Response,
        mockNext
      );
      await flushPromises();

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.message).toBe("Pick up location not found");
    });

    it("calls next with error when service throws", async () => {
      mockReq.params = { id: "uuid-1" } as any;
      (pickUpLocationService.deletePickUpLocation as jest.Mock).mockRejectedValue(
        new Error("DB error")
      );

      pickUpLocationController.deletePickUpLocation(
        mockReq as any,
        mockRes as Response,
        mockNext
      );
      await flushPromises();

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
