import * as blockService from "../../src/services/blockService";
import { AppDataSource } from "../../src/config/data-source";
import { AppError } from "../../src/utils/AppError";

jest.mock("../../src/config/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe("blockService", () => {
  const mockBlockRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity: any) => {
      if (entity?.name === "Block") return mockBlockRepo;
      if (entity?.name === "User") return mockUserRepo;
      return null;
    });
  });

  describe("blockUser", () => {
    it("blocks a user successfully", async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: "user-456",
        name: "Blocked User",
      });

      mockBlockRepo.findOne.mockResolvedValue(null);
      mockBlockRepo.create.mockImplementation((data) => ({
        id: "block-1",
        ...data,
      }));
      mockBlockRepo.save.mockResolvedValue(undefined);

      const result = await blockService.blockUser("user-123", "user-456");

      expect(result.message).toMatch(/blocked/i);
      expect(result.block.blockerId).toBe("user-123");
      expect(result.block.blockedId).toBe("user-456");
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { id: "user-456" },
      });
      expect(mockBlockRepo.findOne).toHaveBeenCalledWith({
        where: { blockerId: "user-123", blockedId: "user-456" },
      });
      expect(mockBlockRepo.create).toHaveBeenCalled();
      expect(mockBlockRepo.save).toHaveBeenCalled();
    });

    it("rejects blocking yourself", async () => {
      await expect(
        blockService.blockUser("user-123", "user-123")
      ).rejects.toThrow("You cannot block yourself");
    });

    it("rejects unknown user", async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        blockService.blockUser("user-123", "user-456")
      ).rejects.toThrow("User not found");
    });

    it("rejects duplicate block", async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: "user-456",
      });

      mockBlockRepo.findOne.mockResolvedValue({
        id: "block-1",
        blockerId: "user-123",
        blockedId: "user-456",
      });

      await expect(
        blockService.blockUser("user-123", "user-456")
      ).rejects.toThrow("User is already blocked");
    });
  });

  describe("getMyBlockedUsers", () => {
    it("returns the current user's blocked users", async () => {
      const date = new Date();

      mockBlockRepo.find.mockResolvedValue([
        {
          id: "block-1",
          createdAt: date,
          blocked: {
            id: "user-456",
            name: "Blocked One",
            umassEmail: "blocked1@umass.edu",
            role: "user",
          },
        },
        {
          id: "block-2",
          createdAt: date,
          blocked: {
            id: "user-789",
            name: "Blocked Two",
            umassEmail: "blocked2@umass.edu",
            role: "user",
          },
        },
      ]);

      const result = await blockService.getMyBlockedUsers("user-123");

      expect(mockBlockRepo.find).toHaveBeenCalledWith({
        where: { blockerId: "user-123" },
        relations: ["blocked"],
        order: { createdAt: "DESC" },
      });

      expect(result).toEqual([
        {
          id: "block-1",
          blockedAt: date,
          user: {
            id: "user-456",
            name: "Blocked One",
            umassEmail: "blocked1@umass.edu",
            role: "user",
          },
        },
        {
          id: "block-2",
          blockedAt: date,
          user: {
            id: "user-789",
            name: "Blocked Two",
            umassEmail: "blocked2@umass.edu",
            role: "user",
          },
        },
      ]);
    });

    it("returns an empty array when user has no blocked users", async () => {
      mockBlockRepo.find.mockResolvedValue([]);

      const result = await blockService.getMyBlockedUsers("user-123");

      expect(result).toEqual([]);
    });
  });

  describe("unblockUser", () => {
    it("removes a block successfully", async () => {
      mockBlockRepo.findOne.mockResolvedValue({
        id: "block-1",
        blockerId: "user-123",
        blockedId: "user-456",
      });

      mockBlockRepo.remove.mockResolvedValue(undefined);

      const result = await blockService.unblockUser("user-123", "user-456");

      expect(mockBlockRepo.findOne).toHaveBeenCalledWith({
        where: { blockerId: "user-123", blockedId: "user-456" },
      });
      expect(mockBlockRepo.remove).toHaveBeenCalled();
      expect(result.message).toMatch(/unblocked/i);
    });

    it("rejects missing block", async () => {
      mockBlockRepo.findOne.mockResolvedValue(null);

      await expect(
        blockService.unblockUser("user-123", "user-456")
      ).rejects.toThrow(AppError);

      await expect(
        blockService.unblockUser("user-123", "user-456")
      ).rejects.toThrow("Block not found");
    });
  });
});