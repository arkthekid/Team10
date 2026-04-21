// src/pages/Favorites.tsx
import { useEffect, useState } from "react";
import MarketplaceHeader from "@/components/MarketplaceHeader";
import ListingCard from "@/components/ListingCard";
import { getMyFavorites } from "@/lib/favoriteApi";

const Favorites = () => {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFavorites() {
      try {
        setLoading(true);
        setError("");

        const data = await getMyFavorites();

        const normalizedFavorites = Array.isArray(data)
          ? data
          : Array.isArray(data.favorites)
          ? data.favorites
          : [];

        setFavorites(normalizedFavorites);
      } catch (err: any) {
        setError(err.message || "Failed to load favorites");
      } finally {
        setLoading(false);
      }
    }

    loadFavorites();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MarketplaceHeader />

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6">
        <h1 className="text-3xl font-bold mb-6">My Favorites</h1>

        {loading && (
          <p className="text-center text-muted-foreground mt-12">
            Loading favorites...
          </p>
        )}

        {error && <p className="text-center text-red-500 mt-12">{error}</p>}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favorites.map((listing) => (
                <ListingCard
                  key={listing.id || listing.listingId || listing.productId || listing._id}
                  listing={listing}
                />
              ))}
            </div>

            {favorites.length === 0 && (
              <p className="text-center text-muted-foreground mt-12">
                You have no favorite listings yet.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Favorites;