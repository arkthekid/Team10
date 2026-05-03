import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";
import MarketplaceHeader from "@/components/MarketplaceHeader";
import { getSellerReviews } from "@/lib/reviewApi";

const formatDate = (value: any) => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const SellerReviews = () => {
  const navigate = useNavigate();
  const { sellerId } = useParams();

  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sellerName, setSellerName] = useState("Seller");

  useEffect(() => {
    async function loadReviews() {
      if (!sellerId) return;

      try {
        setLoading(true);
        setError("");

        const data = await getSellerReviews(sellerId);
        const loadedReviews = Array.isArray(data)
          ? data
          : Array.isArray(data.reviews)
          ? data.reviews
          : [];

        setReviews(loadedReviews);

        if (loadedReviews.length > 0) {
          const firstReview = loadedReviews[0];
          const possibleSellerName =
            firstReview?.reviewee?.name ||
            firstReview?.reviewee?.fullName ||
            firstReview?.reviewee?.displayName ||
            "Seller";

          setSellerName(possibleSellerName);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load seller reviews");
      } finally {
        setLoading(false);
      }
    }

    loadReviews();
  }, [sellerId]);

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
        reviews.length
      : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MarketplaceHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full p-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="bg-card border rounded-2xl p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">{sellerName} Reviews</h1>

          <div className="flex items-center gap-2 text-lg">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">
              {reviews.length > 0 ? averageRating.toFixed(1) : "No rating yet"}
            </span>
            <span className="text-muted-foreground">
              ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
            </span>
          </div>
        </div>

        {loading && <p>Loading reviews...</p>}

        {!loading && error && <p className="text-red-500">{error}</p>}

        {!loading && !error && reviews.length === 0 && (
          <div className="bg-card border rounded-2xl p-6">
            <p className="text-muted-foreground">This seller has no reviews yet.</p>
          </div>
        )}

        {!loading && !error && reviews.length > 0 && (
          <div className="space-y-4">
            {reviews.map((review: any) => {
              const reviewId = review.reviewId || review.id;
              const reviewerName =
                review?.reviewer?.name ||
                review?.reviewer?.fullName ||
                review?.reviewer?.displayName ||
                "Anonymous";

              return (
                <div key={reviewId} className="bg-card border rounded-2xl p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="font-semibold text-lg">{reviewerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 font-semibold">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{review.rating}/5</span>
                    </div>
                  </div>

                  <p className="text-base leading-7">
                    {review.comment || "No comment provided."}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default SellerReviews;