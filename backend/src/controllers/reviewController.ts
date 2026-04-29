import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import * as reviewService from "../services/reviewService";
import { getUserId } from "../utils/getUserId";

export const createReview = async (
  req: Request<{ userId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const reviewerId = getUserId(req);
    const { userId: revieweeId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return next(new AppError("Rating and comment are required", 400));
    }

    const review = await reviewService.createReview(
      reviewerId,
      revieweeId,
      rating,
      comment
    );
    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
};

export const getReviewsByUserId = async (
  req: Request<{ userId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const reviews = await reviewService.getReviewsByUserId(userId);
    res.status(200).json(reviews);
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (
  req: Request<{ reviewId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const reviewerId = getUserId(req);
    const { reviewId } = req.params;
    const result = await reviewService.deleteReview(reviewId, reviewerId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};