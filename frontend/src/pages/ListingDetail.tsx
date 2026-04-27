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
} from "lucide-react";
import MarketplaceHeader from "@/components/MarketplaceHeader";
import SafetyNotice from "@/components/SafetyNotice";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getListingById, deleteListing } from "../lib/listingApi";
import { blockUser } from "../lib/blockApi";
import {
  addFavorite,
  getMyFavorites,
  removeFavorite,
} from "../lib/favoriteApi";

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

const getListingImage = (listing: any) => {
  const firstImage = Array.isArray(listing.images)
    ? listing.images[0]?.url ||
      listing.images[0]?.imageUrl ||
      listing.images[0]?.publicUrl ||
      listing.images[0]
    : undefined;

  return (
    listing.imageUrl ||
    listing.image ||
    listing.photoUrl ||
    listing.photo ||
    listing.listingImage ||
    firstImage ||
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"
  );
};

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSafetyNotice, setShowSafetyNotice] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadListing() {
      if (!id) return;

      try {
        setLoading(true);
        setError("");

        const data = await getListingById(id);
        const loadedListing = data.listing || data;

        console.log("Loaded listing:", loadedListing);

        setListing(loadedListing);
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

  const handleDelete = async () => {
    if (!id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this listing?"
    );
    if (!confirmed) return;

    try {
      setDeleting(true);
      await deleteListing(id);
      toast.success("Listing deleted successfully");
      navigate("/browse");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete listing");
    } finally {
      setDeleting(false);
      setMenuOpen(false);
    }
  };

  const handleBlockSeller = async () => {
    const sellerId =
      listing?.sellerId ||
      listing?.seller?.id ||
      listing?.seller?.userId ||
      listing?.user?.id ||
      listing?.user?.userId;

    if (!sellerId) {
      toast.error("Seller information not found");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to block this seller?"
    );
    if (!confirmed) return;

    try {
      setBlocking(true);
      await blockUser(sellerId);
      toast.success("Seller blocked successfully");
      navigate("/browse");
    } catch (err: any) {
      console.error("block seller error:", err);
      toast.error(err.message || "Failed to block seller");
    } finally {
      setBlocking(false);
      setMenuOpen(false);
    }
  };

  const handleFavoriteToggle = async () => {
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

  const handleMessageSeller = () => {
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

  const title = listing.name || listing.title || "Untitled Listing";

  const price =
    listing.price === null || listing.price === undefined
      ? null
      : Number(listing.price);

  const image = getListingImage(listing);

  const location = listing.pickUpLocation || listing.location || "Not provided";
  const description = listing.description || "No description provided.";

  const rawCategory =
    listing.category ||
    listing.categoryName ||
    listing.categoryType ||
    listing.listingCategory ||
    listing.type ||
    listing.itemCategory ||
    listing.productCategory ||
    "General";

  const category = formatCategory(rawCategory);

  const condition = listing.condition || "Not provided";

  const sellerName =
    listing.sellerName ||
    listing.nameOfSeller ||
    listing.seller?.name ||
    listing.user?.name ||
    "Seller";

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
            <button
              type="button"
              onClick={handleFavoriteToggle}
              disabled={favoriteLoading}
              className="p-2 rounded-md hover:bg-muted disabled:opacity-60"
              aria-label={
                isFavorited ? "Remove from favorites" : "Add to favorites"
              }
              title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                className={`w-6 h-6 transition-colors ${
                  isFavorited
                    ? "fill-red-500 text-red-500"
                    : "text-foreground"
                }`}
              />
            </button>

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
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-left"
                    onClick={() => {
                      setMenuOpen(false);
                      toast.info("Report feature coming soon");
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

                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-left text-red-600 disabled:opacity-60"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>{deleting ? "Deleting..." : "Delete Listing"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="rounded-2xl overflow-hidden border bg-card">
            <img
              src={image}
              alt={title}
              className="w-full aspect-square object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80";
              }}
            />
          </div>

          <div>
            <h1 className="text-4xl font-bold mb-2">{title}</h1>

            <p className="text-2xl font-bold text-primary mb-6">
              {price === null || Number(price) === 0
                ? "FREE"
                : `$${price.toLocaleString()}`}
            </p>

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

              <div>
                <p className="font-semibold mb-1">Description:</p>
                <p className="text-lg leading-8">{description}</p>
              </div>
            </div>

            <Button onClick={handleMessageSeller} className="w-full h-14 text-lg">
              Message Seller
            </Button>
          </div>
        </div>
      </main>

      <SafetyNotice
        open={showSafetyNotice}
        onClose={() => setShowSafetyNotice(false)}
        onProceed={handleSafetyProceed}
      />
    </div>
  );
};

export default ListingDetail;