import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MarketplaceHeader from "@/components/MarketplaceHeader";
import { getMyListings } from "@/lib/listingApi";
import { toast } from "sonner";

const fallbackImage =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80";

const getListingId = (listing: any) => {
  return listing.listingId || listing.id || listing.productId || listing._id;
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
    fallbackImage
  );
};

const getStatusLabel = (status: string | undefined) => {
  const value = String(status || "available").toLowerCase();

  if (value === "sold_pending" || value === "pending") return "Pending";
  if (value === "completed" || value === "sold") return "Sold";
  return "Available";
};

const getStatusClass = (status: string | undefined) => {
  const label = getStatusLabel(status);

  if (label === "Pending") {
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  }

  if (label === "Sold") {
    return "bg-red-100 text-red-800 border-red-200";
  }

  return "bg-green-100 text-green-800 border-green-200";
};

const normalizeListings = (data: any) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.listings)) return data.listings;
  if (Array.isArray(data.data)) return data.data;
  return [];
};

const MyListings = () => {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMyListings() {
      try {
        setLoading(true);

        const data = await getMyListings();
        const normalized = normalizeListings(data);

        setListings(normalized);
      } catch (err: any) {
        console.error("LOAD MY LISTINGS ERROR:", err);
        toast.error(err.message || "Failed to load your listings");
      } finally {
        setLoading(false);
      }
    }

    loadMyListings();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MarketplaceHeader />

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Listings</h1>
            <p className="text-muted-foreground mt-1">
              View and manage everything you have posted.
            </p>
          </div>

          <Link
            to="/create"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90"
          >
            + Create listing
          </Link>
        </div>

        {loading && (
          <p className="text-center text-muted-foreground mt-12">
            Loading your listings...
          </p>
        )}

        {!loading && listings.length === 0 && (
          <p className="text-center text-muted-foreground mt-12">
            You have not created any listings yet.
          </p>
        )}

        {!loading && listings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => {
              const id = getListingId(listing);
              const title = listing.name || listing.title || "Untitled Listing";

              const price =
                listing.price === null || listing.price === undefined
                  ? null
                  : Number(listing.price);

              const location =
                listing.pickUpLocation ||
                listing.location ||
                "Pickup location not provided";

              const image = getListingImage(listing);
              const statusLabel = getStatusLabel(listing.status);

              return (
                <Link
                  key={id}
                  to={`/listing/${id}`}
                  className="group bg-card rounded-lg border overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img
                      src={image}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = fallbackImage;
                      }}
                    />

                    <span
                      className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusClass(
                        listing.status
                      )}`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <div className="p-3">
                    <p className="font-bold text-card-foreground">
                      {price === null || Number(price) === 0
                        ? "FREE"
                        : `$${price.toLocaleString(undefined, {
                            minimumFractionDigits: price % 1 === 0 ? 0 : 2,
                            maximumFractionDigits: 2,
                          })}`}
                    </p>

                    <p className="text-sm text-card-foreground truncate">
                      {title}
                    </p>

                    <p className="text-xs text-muted-foreground mt-1">
                      {location}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyListings;