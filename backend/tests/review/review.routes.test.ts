import request from "supertest";
import express from "express";
import reviewRoutes from "../../src/routes/reviewRoutes";
import * as reviewController from "../../src/controllers/reviewController";

jest.mock("../../src/controllers/reviewController");
jest.mock("../../src/middleware/auth", () => ({
  protect: (req: any, res: any, next: any) => next(),
}));

describe("reviewRoutes", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/reviews", reviewRoutes);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/reviews/:userId", () => {
    it("calls createReview controller", async () => {
      (reviewController.createReview as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(201).json({
            reviewId: "review-1",
            rating: 5,
            comment: "Great seller!",
          });
        }
      );

      const res = await request(app)
        .post("/api/reviews/user-2")
        .send({ rating: 5, comment: "Great seller!" });

      expect(res.status).toBe(201);
      expect(reviewController.createReview).toHaveBeenCalled();
    });
  });

  describe("GET /api/reviews/:userId", () => {
    it("calls getReviewsByUserId controller", async () => {
      (reviewController.getReviewsByUserId as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(200).json([
            { reviewId: "review-1", rating: 5, comment: "Great seller!" },
          ]);
        }
      );

      const res = await request(app).get("/api/reviews/user-2");

      expect(res.status).toBe(200);
      expect(reviewController.getReviewsByUserId).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/reviews/:reviewId", () => {
    it("calls deleteReview controller", async () => {
      (reviewController.deleteReview as jest.Mock).mockImplementation(
        (req, res) => {
          res.status(200).json({ message: "Review deleted successfully" });
        }
      );

      const res = await request(app).delete("/api/reviews/review-1");

      expect(res.status).toBe(200);
      expect(reviewController.deleteReview).toHaveBeenCalled();
    });
  });
});