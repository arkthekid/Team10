import { Request, Response } from "express";
import * as blockService from "../../src/services/blockService";
import {
  blockUser,
  getMyBlockedUsers,
  unblockUser,
} from "../../src/controllers/blockController";

jest.mock("../../src/services/blockService");
jest.mock("../../src/utils/getUserId", () => ({
  getUserId: jest.fn(() => "user-123"),
}));

const flushPromises = () => new Promise(process.nextTick);

describe("blockController", () => {
  let mockReq: Partial<Request<{ id: string }>>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      params: { id: "" },
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe("blockUser", () => {
    it("returns 201 and json response when blockUser succeeds", async () => {
      const serviceResult = {
        message: "User blocked successfully",
        block: {
          id: "block-1",
          blockerId: "user-123",
          blockedId: "user-456",
        },
      };

      mockReq.params = { id: "user-456" };
      (blockService.blockUser as jest.Mock).mockResolvedValue(serviceResult);

      blockUser(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      await flushPromises();

      expect(blockService.blockUser).toHaveBeenCalledWith("user-123", "user-456");
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(serviceResult);
    });

    it("calls next(error) when blockUser fails", async () => {
      const error = new Error("Block failed");
      mockReq.params = { id: "user-456" };
      (blockService.blockUser as jest.Mock).mockRejectedValue(error);

      blockUser(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      await flushPromises();

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getMyBlockedUsers", () => {
    it("returns 200 and json response when getMyBlockedUsers succeeds", async () => {
      const serviceResult = [
        {
          id: "block-1",
          blockedAt: new Date(),
          user: {
            id: "user-456",
            name: "Blocked User",
            umassEmail: "blocked@umass.edu",
            role: "user",
          },
        },
      ];

      (blockService.getMyBlockedUsers as jest.Mock).mockResolvedValue(serviceResult);

      getMyBlockedUsers(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      await flushPromises();

      expect(blockService.getMyBlockedUsers).toHaveBeenCalledWith("user-123");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(serviceResult);
    });

    it("calls next(error) when getMyBlockedUsers fails", async () => {
      const error = new Error("Get blocked users failed");
      (blockService.getMyBlockedUsers as jest.Mock).mockRejectedValue(error);

      getMyBlockedUsers(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      await flushPromises();

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("unblockUser", () => {
    it("returns 204 when unblockUser succeeds", async () => {
      mockReq.params = { id: "user-456" };
      (blockService.unblockUser as jest.Mock).mockResolvedValue({
        message: "User unblocked successfully",
      });

      unblockUser(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      await flushPromises();

      expect(blockService.unblockUser).toHaveBeenCalledWith("user-123", "user-456");
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it("calls next(error) when unblockUser fails", async () => {
      const error = new Error("Unblock failed");
      mockReq.params = { id: "user-456" };
      (blockService.unblockUser as jest.Mock).mockRejectedValue(error);

      unblockUser(
        mockReq as Request<{ id: string }>,
        mockRes as Response,
        mockNext
      );

      await flushPromises();

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});