import * as reviewService from "../../src/services/reviewService";
import { AppDataSource } from "../../src/config/data-source";
import { Review } from "../../src/entities/Review";
import { User } from "../../src/entities/User";
import { AppError } from "../../src/utils/AppError";

jest.mock("../../src/config/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe("reviewService", () => {
  const mockReviewRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === Review) return mockReviewRepo;
      if (entity === User) return mockUserRepo;
    });
  });

  describe("createReview", () => {
    it("creates a review successfully", async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: "user-2", name: "Seller" });
      mockReviewRepo.findOne.mockResolvedValue(null);
      mockReviewRepo.create.mockReturnValue({
        reviewId: "review-1",
        reviewerId: "user-1",
        revieweeId: "user-2",
        rating: 5,
        comment: "Great seller!",
      });
      mockReviewRepo.save.mockResolvedValue({
        reviewId: "review-1",
        reviewerId: "user-1",
        revieweeId: "user-2",
        rating: 5,
        comment: "Great seller!",
      });

      const result = await reviewService.createReview(
        "user-1",
        "user-2",
        5,
        "Great seller!"
      );

      expect(result.rating).toBe(5);
      expect(result.comment).toBe("Great seller!");
      expect(mockReviewRepo.save).toHaveBeenCalled();
    });

    it("throws 400 if reviewer tries to review themselves", async () => {
      await expect(
        reviewService.createReview("user-1", "user-1", 5, "Great!")
      ).rejects.toThrow("You cannot review yourself");
    });

    it("throws 400 if rating is out of range", async () => {
      await expect(
        reviewService.createReview("user-1", "user-2", 6, "Great!")
      ).rejects.toThrow("Rating must be between 1 and 5");
    });

    it("throws 400 if comment is empty", async () => {
      await expect(
        reviewService.createReview("user-1", "user-2", 5, "")
      ).rejects.toThrow("Comment cannot be empty");
    });

    it("throws 404 if reviewee not found", async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        reviewService.createReview("user-1", "user-2", 5, "Great!")
      ).rejects.toThrow("User not found");
    });

    it("throws 409 if review already exists", async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: "user-2" });
      mockReviewRepo.findOne.mockResolvedValue({
        reviewId: "review-1",
        reviewerId: "user-1",
        revieweeId: "user-2",
      });

      await expect(
        reviewService.createReview("user-1", "user-2", 5, "Great!")
      ).rejects.toThrow("You have already reviewed this user");
    });

    it("throws if save fails", async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: "user-2" });
      mockReviewRepo.findOne.mockResolvedValue(null);
      mockReviewRepo.create.mockReturnValue({});
      mockReviewRepo.save.mockRejectedValue(new Error("Save failed"));

      await expect(
        reviewService.createReview("user-1", "user-2", 5, "Great!")
      ).rejects.toThrow("Save failed");
    });
  });

  describe("getReviewsByUserId", () => {
    it("returns reviews for a user", async () => {
      mockReviewRepo.find.mockResolvedValue([
        { reviewId: "review-1", revieweeId: "user-2", rating: 5 },
        { reviewId: "review-2", revieweeId: "user-2", rating: 4 },
      ]);

      const result = await reviewService.getReviewsByUserId("user-2");

      expect(result).toHaveLength(2);
      expect(mockReviewRepo.find).toHaveBeenCalled();
    });

    it("returns empty array when user has no reviews", async () => {
      mockReviewRepo.find.mockResolvedValue([]);

      const result = await reviewService.getReviewsByUserId("user-2");

      expect(result).toEqual([]);
    });

    it("throws if repository fails", async () => {
      mockReviewRepo.find.mockRejectedValue(new Error("DB error"));

      await expect(
        reviewService.getReviewsByUserId("user-2")
      ).rejects.toThrow("DB error");
    });
  });

  describe("deleteReview", () => {
    it("deletes a review successfully", async () => {
      const mockReview = {
        reviewId: "review-1",
        reviewerId: "user-1",
      };
      mockReviewRepo.findOne.mockResolvedValue(mockReview);
      mockReviewRepo.remove.mockResolvedValue(undefined);

      const result = await reviewService.deleteReview("review-1", "user-1");

      expect(result.message).toBe("Review deleted successfully");
      expect(mockReviewRepo.remove).toHaveBeenCalledWith(mockReview);
    });

    it("throws 404 if review not found", async () => {
      mockReviewRepo.findOne.mockResolvedValue(null);

      await expect(
        reviewService.deleteReview("review-1", "user-1")
      ).rejects.toThrow("Review not found");
    });

    it("throws 403 if user is not the reviewer", async () => {
      mockReviewRepo.findOne.mockResolvedValue({
        reviewId: "review-1",
        reviewerId: "user-1",
      });

      await expect(
        reviewService.deleteReview("review-1", "stranger")
      ).rejects.toThrow("Unauthorized");
    });

    it("throws if remove fails", async () => {
      mockReviewRepo.findOne.mockResolvedValue({
        reviewId: "review-1",
        reviewerId: "user-1",
      });
      mockReviewRepo.remove.mockRejectedValue(new Error("Remove failed"));

      await expect(
        reviewService.deleteReview("review-1", "user-1")
      ).rejects.toThrow("Remove failed");
    });
  });
});