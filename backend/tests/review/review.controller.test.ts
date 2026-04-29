import { Request, Response, NextFunction } from "express";
import * as reviewController from "../../src/controllers/reviewController";
import * as reviewService from "../../src/services/reviewService";
import { AppError } from "../../src/utils/AppError";

jest.mock("../../src/services/reviewService");

const flushPromises = () => new Promise(process.nextTick);

describe("reviewController", () => {
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

  describe("createReview", () => {
    it("returns 201 and created review on success", async () => {
      mockReq.params = { userId: "user-2" } as any;
      mockReq.body = { rating: 5, comment: "Great seller!" };
      mockReq.user = { id: "user-1", email: "arkar@umass.edu", role: "user" };

      (reviewService.createReview as jest.Mock).mockResolvedValue({
        reviewId: "review-1",
        reviewerId: "user-1",
        revieweeId: "user-2",
        rating: 5,
        comment: "Great seller!",
      });

      reviewController.createReview(mockReq as any, mockRes as Response, mockNext);
      await flushPromises();

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ rating: 5, comment: "Great seller!" })
      );
    });

    it("calls next with 400 when rating or comment is missing", async () => {
      mockReq.params = { userId: "user-2" } as any;
      mockReq.body = {};
      mockReq.user = { id: "user-1", email: "arkar@umass.edu", role: "user" };

      reviewController.createReview(mockReq as any, mockRes as Response, mockNext);
      await flushPromises();

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe("Rating and comment are required");
    });

    it("calls next with error when service throws", async () => {
      mockReq.params = { userId: "user-2" } as any;
      mockReq.body = { rating: 5, comment: "Great!" };
      mockReq.user = { id: "user-1", email: "arkar@umass.edu", role: "user" };

      (reviewService.createReview as jest.Mock).mockRejectedValue(
        new AppError("You have already reviewed this user", 409)
      );

      reviewController.createReview(mockReq as any, mockRes as Response, mockNext);
      await flushPromises();

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.message).toBe("You have already reviewed this user");
    });
  });

  describe("getReviewsByUserId", () => {
    it("returns 200 and reviews on success", async () => {
      mockReq.params = { userId: "user-2" } as any;

      (reviewService.getReviewsByUserId as jest.Mock).mockResolvedValue([
        { reviewId: "review-1", rating: 5, comment: "Great!" },
        { reviewId: "review-2", rating: 4, comment: "Good!" },
      ]);

      reviewController.getReviewsByUserId(mockReq as any, mockRes as Response, mockNext);
      await flushPromises();

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ rating: 5 }),
          expect.objectContaining({ rating: 4 }),
        ])
      );
    });

    it("returns 200 and empty array when no reviews", async () => {
      mockReq.params = { userId: "user-2" } as any;

      (reviewService.getReviewsByUserId as jest.Mock).mockResolvedValue([]);

      reviewController.getReviewsByUserId(mockReq as any, mockRes as Response, mockNext);
      await flushPromises();

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    it("calls next with error when service throws", async () => {
      mockReq.params = { userId: "user-2" } as any;

      (reviewService.getReviewsByUserId as jest.Mock).mockRejectedValue(
        new Error("DB error")
      );

      reviewController.getReviewsByUserId(mockReq as any, mockRes as Response, mockNext);
      await flushPromises();

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("deleteReview", () => {
    it("returns 200 and success message on success", async () => {
      mockReq.params = { reviewId: "review-1" } as any;
      mockReq.user = { id: "user-1", email: "arkar@umass.edu", role: "user" };

      (reviewService.deleteReview as jest.Mock).mockResolvedValue({
        message: "Review deleted successfully",
      });

      reviewController.deleteReview(mockReq as any, mockRes as Response, mockNext);
      await flushPromises();

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Review deleted successfully",
      });
    });

    it("calls next with 404 error when review not found", async () => {
      mockReq.params = { reviewId: "review-1" } as any;
      mockReq.user = { id: "user-1", email: "arkar@umass.edu", role: "user" };

      (reviewService.deleteReview as jest.Mock).mockRejectedValue(
        new AppError("Review not found", 404)
      );

      reviewController.deleteReview(mockReq as any, mockRes as Response, mockNext);
      await flushPromises();

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.message).toBe("Review not found");
    });

    it("calls next with 403 error when unauthorized", async () => {
      mockReq.params = { reviewId: "review-1" } as any;
      mockReq.user = { id: "stranger", email: "stranger@umass.edu", role: "user" };

      (reviewService.deleteReview as jest.Mock).mockRejectedValue(
        new AppError("Unauthorized", 403)
      );

      reviewController.deleteReview(mockReq as any, mockRes as Response, mockNext);
      await flushPromises();

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.message).toBe("Unauthorized");
    });
  });
});