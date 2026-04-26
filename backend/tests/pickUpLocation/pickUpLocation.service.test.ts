import * as pickUpLocationService from "../../src/services/pickUpLocationService";
import { AppDataSource } from "../../src/config/data-source";
import { AppError } from "../../src/utils/AppError";

jest.mock("../../src/config/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe("pickUpLocationService", () => {
  const mockRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);
  });

  describe("createPickUpLocation", () => {
    it("creates a new pick up location successfully", async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockReturnValue({ locationId: "uuid-1", name: "Orchard Hill" });
      mockRepo.save.mockResolvedValue({ locationId: "uuid-1", name: "Orchard Hill" });

      const result = await pickUpLocationService.createPickUpLocation("Orchard Hill");

      expect(result.name).toBe("Orchard Hill");
      expect(mockRepo.create).toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it("throws 409 if location already exists", async () => {
      mockRepo.findOne.mockResolvedValue({ locationId: "uuid-1", name: "Orchard Hill" });

      await expect(
        pickUpLocationService.createPickUpLocation("Orchard Hill")
      ).rejects.toThrow("Pick up location already exists");
    });

    it("throws if save fails", async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockReturnValue({ name: "Orchard Hill" });
      mockRepo.save.mockRejectedValue(new Error("Save failed"));

      await expect(
        pickUpLocationService.createPickUpLocation("Orchard Hill")
      ).rejects.toThrow("Save failed");
    });
  });
});