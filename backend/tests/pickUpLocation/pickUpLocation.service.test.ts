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

  describe("getAllPickUpLocations", () => {
    it("returns all pick up locations", async () => {
      mockRepo.find.mockResolvedValue([
        { locationId: "uuid-1", name: "Orchard Hill" },
        { locationId: "uuid-2", name: "Student Union" },
      ]);

      const result = await pickUpLocationService.getAllPickUpLocations();

      expect(result).toHaveLength(2);
      expect(mockRepo.find).toHaveBeenCalled();
    });

    it("returns empty array when no locations exist", async () => {
      mockRepo.find.mockResolvedValue([]);

      const result = await pickUpLocationService.getAllPickUpLocations();

      expect(result).toHaveLength(0);
    });

    it("throws if database query fails", async () => {
      mockRepo.find.mockRejectedValue(new Error("DB error"));

      await expect(
        pickUpLocationService.getAllPickUpLocations()
      ).rejects.toThrow("DB error");
    });
  });

    describe("getPickUpLocationById", () => {
    it("returns a pick up location by id", async () => {
      mockRepo.findOne.mockResolvedValue({ locationId: "uuid-1", name: "Orchard Hill" });

      const result = await pickUpLocationService.getPickUpLocationById("uuid-1");

      expect(result.name).toBe("Orchard Hill");
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { locationId: "uuid-1" } });
    });

    it("throws 404 if location not found", async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        pickUpLocationService.getPickUpLocationById("uuid-1")
      ).rejects.toThrow("Pick up location not found");
    });

    it("throws if database query fails", async () => {
      mockRepo.findOne.mockRejectedValue(new Error("DB error"));

      await expect(
        pickUpLocationService.getPickUpLocationById("uuid-1")
      ).rejects.toThrow("DB error");
    });
  });

    describe("updatePickUpLocation", () => {
    it("updates a pick up location successfully", async () => {
      mockRepo.findOne.mockResolvedValue({ locationId: "uuid-1", name: "Orchard Hill" });
      mockRepo.save.mockResolvedValue({ locationId: "uuid-1", name: "Updated Name" });

      const result = await pickUpLocationService.updatePickUpLocation("uuid-1", "Updated Name");

      expect(result.name).toBe("Updated Name");
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it("throws 404 if location not found", async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        pickUpLocationService.updatePickUpLocation("uuid-1", "Updated Name")
      ).rejects.toThrow("Pick up location not found");
    });

    it("throws if save fails", async () => {
      mockRepo.findOne.mockResolvedValue({ locationId: "uuid-1", name: "Orchard Hill" });
      mockRepo.save.mockRejectedValue(new Error("Save failed"));

      await expect(
        pickUpLocationService.updatePickUpLocation("uuid-1", "Updated Name")
      ).rejects.toThrow("Save failed");
    });
  });

    describe("deletePickUpLocation", () => {
    it("deletes a pick up location successfully", async () => {
      mockRepo.findOne.mockResolvedValue({ locationId: "uuid-1", name: "Orchard Hill" });
      mockRepo.remove.mockResolvedValue(undefined);

      const result = await pickUpLocationService.deletePickUpLocation("uuid-1");

      expect(result.message).toBe("Pick up location deleted successfully");
      expect(mockRepo.remove).toHaveBeenCalled();
    });

    it("throws 404 if location not found", async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        pickUpLocationService.deletePickUpLocation("uuid-1")
      ).rejects.toThrow("Pick up location not found");
    });

    it("throws if remove fails", async () => {
      mockRepo.findOne.mockResolvedValue({ locationId: "uuid-1", name: "Orchard Hill" });
      mockRepo.remove.mockRejectedValue(new Error("Remove failed"));

      await expect(
        pickUpLocationService.deletePickUpLocation("uuid-1")
      ).rejects.toThrow("Remove failed");
    });
  });
});