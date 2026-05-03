import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  MoreHorizontal,
  ArrowLeft,
  Flag,
  ShieldX,
  Trash2,
  Heart,
  Pencil,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import MarketplaceHeader from "@/components/MarketplaceHeader";
import SafetyNotice from "@/components/SafetyNotice";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  getListingById,
  deleteListing,
  getMyListings,
} from "../lib/listingApi";
import { blockUser } from "../lib/blockApi";
import { getCurrentUser } from "../lib/authApi";
import {
  addFavorite,
  getMyFavorites,
  removeFavorite,
} from "../lib/favoriteApi";
import { createReport, ReportReason } from "../lib/reportApi";

const fallbackImage =
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80";

const formatCategory = (value: any) => {
  if (!value) return "General";

  if (typeof value === "object") {
    const nestedValue =
      value.name || value.label || value.value || value.category || "General";

    return formatCategory(nestedValue);
  }

  return String(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getListingStatus = (listing: any) => {
  const status = String(listing?.status || "available").toLowerCase();

  if (status === "sold_pending" || status === "pending") return "sold_pending";
  if (status === "completed" || status === "complete" || status === "sold") {
    return "completed";
  }

  return "available";
};

const getStatusLabel = (status: string) => {
  if (status === "sold_pending") return "Sale Pending";
  if (status === "completed") return "Complete";
  return "Available";
};

const getStatusClass = (status: string) => {
  if (status === "sold_pending") {
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  }

  if (status === "completed") {
    return "bg-green-100 text-green-800 border-green-200";
  }

  return "bg-blue-100 text-blue-800 border-blue-200";
};

const getListingId = (listing: any) => {
  return String(
    listing?.listingId ||
      listing?.id ||
      listing?.productId ||
      listing?._id ||
      listing?.listing?.listingId ||
      listing?.listing?.id ||
      ""
  );
};

const getLocalListingMetadata = (listingId: string) => {
  try {
    const savedMetadata = JSON.parse(
      localStorage.getItem("listingMetadata") || "{}"
    );

    return savedMetadata[String(listingId)] || {};
  } catch {
    return {};
  }
};

const getListingImages = (listing: any) => {
  const uploadedImages = Array.isArray(listing.images)
    ? listing.images
        .map((image: any) => {
          if (typeof image === "string") return image;

          return (
            image?.url ||
            image?.imageUrl ||
            image?.publicUrl ||
            image?.src ||
            ""
          );
        })
        .filter(Boolean)
    : [];

  const singleImages = [
    listing.imageUrl,
    listing.image,
    listing.photoUrl,
    listing.photo,
    listing.listingImage,
  ].filter(Boolean);

  const allImages = [...uploadedImages, ...singleImages];
  const uniqueImages = Array.from(new Set(allImages));

  return uniqueImages.length > 0 ? uniqueImages : [fallbackImage];
};

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

const getUserFromResponse = (data: any) => {
  return data?.user || data?.data?.user || data?.data || data || {};
};

const getUserId = (userData: any) => {
  const user = getUserFromResponse(userData);

  return String(
    user?.id ||
      user?.userId ||
      user?._id ||
      user?.sub ||
      user?.user?.id ||
      user?.user?.userId ||
      ""
  );
};

const getUserEmail = (userData: any) => {
  const user = getUserFromResponse(userData);

  return String(
    user?.umassEmail ||
      user?.email ||
      user?.user?.umassEmail ||
      user?.user?.email ||
      ""
  ).toLowerCase();
};

const getUserName = (userData: any) => {
  const user = getUserFromResponse(userData);

  return String(
    user?.name ||
      user?.fullName ||
      user?.displayName ||
      user?.user?.name ||
      user?.user?.fullName ||
      user?.user?.displayName ||
      ""
  )
    .trim()
    .toLowerCase();
};

const getSellerId = (listing: any) => {
  return String(
    listing?.sellerId ||
      listing?.sellerID ||
      listing?.seller_id ||
      listing?.seller?.id ||
      listing?.seller?.userId ||
      listing?.seller?.sellerId ||
      listing?.seller?._id ||
      listing?.userId ||
      listing?.user_id ||
      listing?.ownerId ||
      listing?.owner_id ||
      listing?.createdById ||
      listing?.created_by ||
      listing?.user?.id ||
      listing?.user?.userId ||
      listing?.user?._id ||
      ""
  );
};

const getSellerEmail = (listing: any) => {
  return String(
    listing?.sellerEmail ||
      listing?.seller?.umassEmail ||
      listing?.seller?.email ||
      listing?.user?.umassEmail ||
      listing?.user?.email ||
      ""
  ).toLowerCase();
};

const getSellerName = (listing: any) => {
  return String(
    listing?.sellerName ||
      listing?.nameOfSeller ||
      listing?.seller?.name ||
      listing?.seller?.fullName ||
      listing?.seller?.displayName ||
      listing?.user?.name ||
      listing?.user?.fullName ||
      listing?.user?.displayName ||
      ""
  )
    .trim()
    .toLowerCase();
};

const decodeJwtPayload = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;

    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalizedPayload));
  } catch {
    return null;
  }
};

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [listing, setListing] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMyListing, setIsMyListing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSafetyNotice, setShowSafetyNotice] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] =
    useState<ReportReason>("fake_listing");
  const [reportComments, setReportComments] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadListing() {
      if (!id) return;

      try {
        setLoading(true);
        setError("");
        setCurrentImageIndex(0);

        const listingData = await getListingById(id);
        const loadedListing = listingData.listing || listingData;

        const userData = await getCurrentUser().catch(() => null);
        const jwtUser = decodeJwtPayload();

        const myListingsData = await getMyListings().catch(() => []);
        const myListings = Array.isArray(myListingsData)
          ? myListingsData
          : Array.isArray(myListingsData.listings)
          ? myListingsData.listings
          : [];

        const currentListingId = getListingId(loadedListing);

        const foundInMyListings = myListings.some((myListing: any) => {
          return getListingId(myListing) === currentListingId;
        });

        setListing(loadedListing);
        setCurrentUser(userData || jwtUser);
        setIsMyListing(foundInMyListings);
      } catch (err: any) {
        setError(err.message || "Listing not found");
      } finally {
        setLoading(false);
      }
    }

    loadListing();
  }, [id]);

  useEffect(() => {
    async function loadFavoriteStatus() {
      if (!id) return;

      try {
        const data = await getMyFavorites();

        const favorites = Array.isArray(data)
          ? data
          : Array.isArray(data.favorites)
          ? data.favorites
          : [];

        const found = favorites.some((fav: any) => {
          const favoriteId =
            fav.listingId ||
            fav.id ||
            fav.productId ||
            fav._id ||
            fav.listing?.listingId ||
            fav.listing?.id;

          return String(favoriteId) === String(id);
        });

        setIsFavorited(found);
      } catch {
        setIsFavorited(false);
      }
    }

    loadFavoriteStatus();
  }, [id]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <MarketplaceHeader />
        <main className="flex-1 max-w-6xl mx-auto w-full p-6">
          <p>Loading listing...</p>
        </main>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <MarketplaceHeader />
        <main className="flex-1 max-w-6xl mx-auto w-full p-6">
          <p className="text-red-500">{error || "Listing not found"}</p>
        </main>
      </div>
    );
  }

  const sellerId = getSellerId(listing);
  const currentUserId = getUserId(currentUser);

  const sellerEmail = getSellerEmail(listing);
  const currentUserEmail = getUserEmail(currentUser);

  const sellerNameForCheck = getSellerName(listing);
  const currentUserName = getUserName(currentUser);

  const tokenPayload = decodeJwtPayload();

  const tokenUserId = String(
    tokenPayload?.id ||
      tokenPayload?.userId ||
      tokenPayload?.sub ||
      tokenPayload?.user?.id ||
      tokenPayload?.user?.userId ||
      ""
  );

  const tokenEmail = String(
    tokenPayload?.umassEmail ||
      tokenPayload?.email ||
      tokenPayload?.user?.umassEmail ||
      tokenPayload?.user?.email ||
      ""
  ).toLowerCase();

  const tokenName = String(
    tokenPayload?.name ||
      tokenPayload?.fullName ||
      tokenPayload?.displayName ||
      tokenPayload?.user?.name ||
      tokenPayload?.user?.fullName ||
      tokenPayload?.user?.displayName ||
      ""
  )
    .trim()
    .toLowerCase();

  const isOwnListing =
    isMyListing ||
    (sellerId && currentUserId && sellerId === currentUserId) ||
    (sellerId && tokenUserId && sellerId === tokenUserId) ||
    (sellerEmail && currentUserEmail && sellerEmail === currentUserEmail) ||
    (sellerEmail && tokenEmail && sellerEmail === tokenEmail) ||
    (sellerNameForCheck &&
      currentUserName &&
      sellerNameForCheck === currentUserName) ||
    (sellerNameForCheck && tokenName && sellerNameForCheck === tokenName);

  const handleDelete = async () => {
    if (!id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this listing?"
    );
    if (!confirmed) return;

    try {
      setDeleting(true);
      console.log("Deleting listing:", id);

      await deleteListing(id);

      toast.success("Listing deleted successfully");
      setMenuOpen(false);
      navigate("/browse");
    } catch (err: any) {
      console.error("DELETE LISTING ERROR:", err);
      toast.error(err.message || "Failed to delete listing");
    } finally {
      setDeleting(false);
      setMenuOpen(false);
    }
  };

  const handleBlockSeller = async () => {
    if (isOwnListing) {
      toast.error("You cannot block yourself");
      setMenuOpen(false);
      return;
    }

    const sellerIdToBlock = getSellerId(listing);

    if (!sellerIdToBlock) {
      toast.error("Seller information not found");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to block this seller?"
    );
    if (!confirmed) return;

    try {
      setBlocking(true);
      await blockUser(sellerIdToBlock);

      const blockedSellerName =
        listing.sellerName ||
        listing.nameOfSeller ||
        listing.seller?.name ||
        listing.user?.name ||
        "This seller";

      toast.success(
        `${blockedSellerName} has been successfully blocked. You will no longer be able to message each other or see each other's listings.`
      );

      setMenuOpen(false);
      navigate("/browse");
    } catch (err: any) {
      console.error("BLOCK SELLER ERROR:", err);
      toast.error(err.message || "Failed to block seller");
    } finally {
      setBlocking(false);
    }
  };

  const handleFavoriteToggle = async () => {
    if (isOwnListing) {
      toast.error("You cannot favorite your own listing");
      return;
    }

    if (!id || favoriteLoading) return;

    try {
      setFavoriteLoading(true);

      if (isFavorited) {
        await removeFavorite(id);
        setIsFavorited(false);
        toast.success("Removed from favorites");
      } else {
        await addFavorite(id);
        setIsFavorited(true);
        toast.success("Added to favorites");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update favorite");
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleViewSellerReviews = () => {
    const sellerIdToView = getSellerId(listing);

    if (isOwnListing || !sellerIdToView) return;

    navigate(`/seller/${sellerIdToView}/reviews`);
  };

  const handleMessageSeller = () => {
    if (isOwnListing) return;
    setShowSafetyNotice(true);
  };

  const handleSafetyProceed = () => {
    setShowSafetyNotice(false);
    navigate(`/messages?listingId=${id}`);
  };

  const handleEditListing = () => {
    if (!id) return;
    setMenuOpen(false);
    navigate(`/listing/${id}/edit`);
  };

  const handleSubmitReport = async () => {
    if (!id) return;

    try {
      setReportSubmitting(true);

      await createReport({
        targetType: "listing",
        targetId: id,
        reason: reportReason,
        comments: reportComments.trim() || null,
      });

      setReportSubmitted(true);
    } catch (err: any) {
      console.error("REPORT LISTING ERROR:", err);
      toast.error(err.message || "Failed to submit report");
    } finally {
      setReportSubmitting(false);
    }
  };

  const images = getListingImages(listing);
  const currentImage = images[currentImageIndex] || fallbackImage;
  const hasMultipleImages = images.length > 1;

  const showPreviousImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const showNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const title = listing.name || listing.title || "Untitled Listing";
  const localMetadata = getLocalListingMetadata(getListingId(listing));

  const price =
    listing.price === null || listing.price === undefined
      ? null
      : Number(listing.price);

  const listingStatus = getListingStatus(listing);

  const location =
    localMetadata.pickUpLocation ||
    (typeof listing.pickUpLocation === "string"
      ? listing.pickUpLocation
      : listing.pickUpLocation?.name) ||
    listing.location ||
    listing.pickupLocation ||
    "Not provided";

  const description = listing.description || "No description provided.";

  const rawCategory =
    localMetadata.category ||
    (Array.isArray(listing.categories) && listing.categories.length > 0
      ? listing.categories[0]
      : listing.category ||
        listing.categoryName ||
        listing.categoryType ||
        listing.listingCategory ||
        listing.type ||
        listing.itemCategory ||
        listing.productCategory ||
        "General");

  const category = formatCategory(rawCategory);
  const condition = listing.condition || "Not provided";

  const sellerName =
    listing.sellerName ||
    listing.nameOfSeller ||
    listing.seller?.name ||
    listing.user?.name ||
    "Seller";

  const createdAt = listing.createdAt || listing.created_at;
  const updatedAt = listing.updatedAt || listing.updated_at;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MarketplaceHeader />

      <main className="flex-1 max-w-6xl mx-auto w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            {!isOwnListing && (
              <>
                <button
                  type="button"
                  onClick={handleFavoriteToggle}
                  disabled={favoriteLoading}
                  className="p-2 rounded-md hover:bg-muted disabled:opacity-60"
                  aria-label={
                    isFavorited ? "Remove from favorites" : "Add to favorites"
                  }
                  title={
                    isFavorited ? "Remove from favorites" : "Add to favorites"
                  }
                >
                  <Heart
                    className={`w-6 h-6 transition-colors ${
                      isFavorited
                        ? "fill-red-500 text-red-500"
                        : "text-foreground"
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={handleViewSellerReviews}
                  className="px-3 py-2 rounded-md hover:bg-muted text-sm font-medium"
                  aria-label="See seller reviews"
                  title="See seller reviews"
                >
                  <span className="hidden sm:inline">See Seller Reviews</span>
                  <span className="sm:hidden">
                    <MessageSquare className="w-5 h-5" />
                  </span>
                </button>
              </>
            )}

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="p-2 rounded-md hover:bg-muted"
              >
                <MoreHorizontal className="w-6 h-6" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-card border rounded-xl shadow-lg p-2 z-20">
                  {isOwnListing ? (
                    <>
                      <button
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-left"
                        onClick={handleEditListing}
                      >
                        <Pencil className="w-5 h-5" />
                        <span>Edit Listing</span>
                      </button>

                      <button
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-left text-red-600 disabled:opacity-60"
                        onClick={handleDelete}
                        disabled={deleting}
                      >
                        <Trash2 className="w-5 h-5" />
                        <span>
                          {deleting ? "Deleting..." : "Delete Listing"}
                        </span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-left"
                        onClick={() => {
                          setMenuOpen(false);
                          setReportSubmitted(false);
                          setShowReportModal(true);
                        }}
                      >
                        <Flag className="w-5 h-5" />
                        <span>Report Listing</span>
                      </button>

                      <button
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-left disabled:opacity-60"
                        onClick={handleBlockSeller}
                        disabled={blocking}
                      >
                        <ShieldX className="w-5 h-5" />
                        <span>{blocking ? "Blocking..." : "Block Seller"}</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="relative rounded-2xl overflow-hidden border bg-card">
            <img
              src={currentImage}
              alt={title}
              className="w-full aspect-square object-cover"
              onError={(e) => {
                e.currentTarget.src = fallbackImage;
              }}
            />

            {hasMultipleImages && (
              <>
                <button
                  type="button"
                  onClick={showPreviousImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-2 shadow-md"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  type="button"
                  onClick={showNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-2 shadow-md"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-background/85 rounded-full px-3 py-1 text-sm font-medium">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>

          <div>
            <h1 className="text-4xl font-bold mb-2">{title}</h1>

            <div className="flex items-center gap-3 mb-6">
              <p className="text-2xl font-bold text-primary">
                {price === null || Number(price) === 0
                  ? "FREE"
                  : `$${price.toLocaleString(undefined, {
                      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
                      maximumFractionDigits: 2,
                    })}`}
              </p>

              <span
                className={`px-3 py-1 rounded-full border text-xs font-semibold ${getStatusClass(
                  listingStatus
                )}`}
              >
                {getStatusLabel(listingStatus)}
              </span>
            </div>

            <div className="space-y-3 text-base mb-6">
              <p>
                <span className="font-semibold">Pick-up Location: </span>
                <span className="text-muted-foreground">{location}</span>
              </p>

              <p>
                <span className="font-semibold">Posted by: </span>
                <span className="text-muted-foreground">{sellerName}</span>
              </p>

              <p>
                <span className="font-semibold">Category: </span>
                <span className="inline-block px-3 py-1 rounded-md bg-muted text-sm">
                  {category}
                </span>
              </p>

              <p>
                <span className="font-semibold">Condition: </span>
                <span className="text-muted-foreground">{condition}</span>
              </p>

              <p>
                <span className="font-semibold">Created: </span>
                <span className="text-muted-foreground">
                  {formatDate(createdAt)}
                </span>
              </p>

              <p>
                <span className="font-semibold">Last updated: </span>
                <span className="text-muted-foreground">
                  {formatDate(updatedAt)}
                </span>
              </p>

              <div>
                <p className="font-semibold mb-1">Description:</p>
                <p className="text-lg leading-8">{description}</p>
              </div>
            </div>

            <Button
              onClick={handleMessageSeller}
              disabled={isOwnListing || listingStatus !== "available"}
              className="w-full h-14 text-lg"
            >
              {isOwnListing
                ? "Your Listing"
                : listingStatus === "sold_pending"
                ? "Sale Pending"
                : listingStatus === "completed"
                ? "Complete"
                : "Message Seller"}
            </Button>
          </div>
        </div>
      </main>

      <SafetyNotice
        open={showSafetyNotice}
        onClose={() => setShowSafetyNotice(false)}
        onProceed={handleSafetyProceed}
      />

      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-background border shadow-xl p-6">
            {reportSubmitted ? (
              <>
                <h3 className="text-xl font-bold mb-3">Report Submitted</h3>

                <p className="text-sm text-muted-foreground leading-6 mb-6">
                  Thank you for your report. The marketplace team will review it
                  and take appropriate action if needed.
                </p>

                <Button
                  type="button"
                  className="w-full"
                  onClick={() => {
                    setShowReportModal(false);
                    setReportSubmitted(false);
                    setReportReason("fake_listing");
                    setReportComments("");
                  }}
                >
                  Close
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-3">Report Listing</h3>

                <p className="text-sm text-muted-foreground leading-6 mb-4">
                  Please choose the reason that best describes the issue with
                  this listing. Reports are reviewed by the marketplace team.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Reason
                    </label>
                    <select
                      value={reportReason}
                      onChange={(e) =>
                        setReportReason(e.target.value as ReportReason)
                      }
                      className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="fake_listing">Fake listing</option>
                      <option value="scam_or_fraud">Scam or fraud</option>
                      <option value="spam">Spam</option>
                      <option value="harassment">Harassment</option>
                      <option value="inappropriate_content">
                        Inappropriate content
                      </option>
                      <option value="suspicious_activity">
                        Suspicious activity
                      </option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Additional details
                    </label>
                    <textarea
                      value={reportComments}
                      onChange={(e) => setReportComments(e.target.value)}
                      className="w-full min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Optional: Explain what seems wrong with this listing."
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setShowReportModal(false);
                      setReportSubmitted(false);
                    }}
                    disabled={reportSubmitting}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="button"
                    className="w-full"
                    onClick={handleSubmitReport}
                    disabled={reportSubmitting}
                  >
                    {reportSubmitting ? "Submitting..." : "Submit Report"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingDetail;