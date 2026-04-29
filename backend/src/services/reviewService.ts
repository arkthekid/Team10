import { AppDataSource } from "../config/data-source";
import { Review } from "../entities/Review";
import { User } from "../entities/User";
import { AppError } from "../utils/AppError";

const getRepo = () => AppDataSource.getRepository(Review);
const getUserRepo = () => AppDataSource.getRepository(User);

export async function createReview(
  reviewerId: string,
  revieweeId: string,
  rating: number,
  comment: string
) {
  if (reviewerId === revieweeId) {
    throw new AppError("You cannot review yourself", 400);
  }

  if (!rating || rating < 1 || rating > 5) {
    throw new AppError("Rating must be between 1 and 5", 400);
  }

  if (!comment || comment.trim() === "") {
    throw new AppError("Comment cannot be empty", 400);
  }

  const reviewee = await getUserRepo().findOne({ where: { id: revieweeId } });
  if (!reviewee) {
    throw new AppError("User not found", 404);
  }

  const existing = await getRepo().findOne({
    where: { reviewerId, revieweeId },
  });
  if (existing) {
    throw new AppError("You have already reviewed this user", 409);
  }

  const review = getRepo().create({ reviewerId, revieweeId, rating, comment });
  return getRepo().save(review);
}

export async function getReviewsByUserId(revieweeId: string) {
  return getRepo().find({
    where: { revieweeId },
    relations: ["reviewer"],
    order: { createdAt: "DESC" },
  });
}

export async function deleteReview(reviewId: string, reviewerId: string) {
  const review = await getRepo().findOne({ where: { reviewId } });

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  if (review.reviewerId !== reviewerId) {
    throw new AppError("Unauthorized", 403);
  }

  await getRepo().remove(review);
  return { message: "Review deleted successfully" };
}