import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import MarketplaceHeader from "@/components/MarketplaceHeader";
import ListingCard from "@/components/ListingCard";
import { getListings } from "@/lib/listingApi";
import { getBlockedUsers } from "@/lib/blockApi";

const Browse = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [priceFilter, setPriceFilter] = useState("all");
  const [listings, setListings] = useState<any[]>([]);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPageData() {
      try {
        setLoading(true);
        setError("");

        const [listingsData, blockedData] = await Promise.all([
          getListings(),
          getBlockedUsers().catch(() => []),
        ]);

        const normalizedListings = Array.isArray(listingsData)
          ? listingsData
          : Array.isArray(listingsData.listings)
          ? listingsData.listings
          : [];

        const normalizedBlocked = Array.isArray(blockedData)
          ? blockedData
          : Array.isArray((blockedData as any).blocks)
          ? (blockedData as any).blocks
          : [];

        const blockedIds = normalizedBlocked
          .map((item: any) => item?.user?.id || item?.blockedId)
          .filter(Boolean)
          .map((id: any) => String(id));

        setListings(normalizedListings);
        setBlockedUserIds(blockedIds);
      } catch (err: any) {
        setError(err.message || "Failed to load listings");
      } finally {
        setLoading(false);
      }
    }

    loadPageData();
  }, []);

  const visibleListings = useMemo(() => {
    return listings.filter((listing) => {
      const sellerId = String(
        listing.sellerId ||
          listing.seller?.id ||
          listing.userId ||
          listing.ownerId ||
          ""
      );

      return !blockedUserIds.includes(sellerId);
    });
  }, [listings, blockedUserIds]);

  const categories = useMemo(() => {
    const names = visibleListings
      .map((l) => {
        if (typeof l.category === "string") return l.category;
        if (l.category?.name) return l.category.name;
        if (l.categoryId?.name) return l.categoryId.name;
        return null;
      })
      .filter(Boolean);

    return ["All", ...Array.from(new Set(names as string[]))];
  }, [visibleListings]);

  const filtered = visibleListings.filter((l) => {
    const title = (l.title || l.name || "").toLowerCase();
    const description = (l.description || "").toLowerCase();

    const listingCategory =
      typeof l.category === "string"
        ? l.category
        : l.category?.name || l.categoryId?.name || "Uncategorized";

    const price =
      l.price === null || l.price === undefined ? null : Number(l.price);

    const matchSearch =
      title.includes(search.toLowerCase()) ||
      description.includes(search.toLowerCase());

    const matchCategory = category === "All" || listingCategory === category;

    const matchPrice =
      priceFilter === "all" ||
      (priceFilter === "free" && price === null) ||
      (priceFilter === "under20" && price !== null && price < 20) ||
      (priceFilter === "under50" && price !== null && price < 50) ||
      (priceFilter === "under100" && price !== null && price < 100) ||
      (priceFilter === "over100" && price !== null && price >= 100);

    return matchSearch && matchCategory && matchPrice;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MarketplaceHeader />

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6 items-stretch">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search Marketplace"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11"
            />
          </div>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-36 h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priceFilter} onValueChange={setPriceFilter}>
            <SelectTrigger className="w-full sm:w-36 h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All prices</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="under20">Under $20</SelectItem>
              <SelectItem value="under50">Under $50</SelectItem>
              <SelectItem value="under100">Under $100</SelectItem>
              <SelectItem value="over100">Above $100</SelectItem>
            </SelectContent>
          </Select>

          <Button asChild className="h-11 whitespace-nowrap">
            <Link to="/create">+ Create listing</Link>
          </Button>
        </div>

        {loading && (
          <p className="text-center text-muted-foreground mt-12">
            Loading listings...
          </p>
        )}

        {error && <p className="text-center text-red-500 mt-12">{error}</p>}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((listing) => (
                <ListingCard
                  key={
                    listing.id ||
                    listing.listingId ||
                    listing.productId ||
                    listing._id
                  }
                  listing={listing}
                />
              ))}
            </div>

            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground mt-12">
                No listings found.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Browse;