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
import { getCategories, getListingById, getListings } from "@/lib/listingApi";
import { getBlockedUsers } from "@/lib/blockApi";

const getListingId = (listing: any) => {
  return String(
    listing.listingId || listing.id || listing.productId || listing._id || ""
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

const normalizeCategoryName = (value: any) => {
  if (!value) return "Uncategorized";

  if (typeof value === "object") {
    return normalizeCategoryName(
      value.name || value.label || value.value || value.category
    );
  }

  return String(value).trim();
};

const getListingCategory = (listing: any) => {
  const listingId = getListingId(listing);
  const localMetadata = getLocalListingMetadata(listingId);

  if (localMetadata.category) {
    return normalizeCategoryName(localMetadata.category);
  }

  if (Array.isArray(listing.categories) && listing.categories.length > 0) {
    return normalizeCategoryName(listing.categories[0]);
  }

  if (typeof listing.category === "string") {
    return normalizeCategoryName(listing.category);
  }

  if (listing.category?.name) return normalizeCategoryName(listing.category.name);
  if (listing.category?.label) return normalizeCategoryName(listing.category.label);
  if (listing.category?.value) return normalizeCategoryName(listing.category.value);
  if (listing.categoryId?.name) return normalizeCategoryName(listing.categoryId.name);

  return "Uncategorized";
};

const getListingLocation = (listing: any) => {
  const listingId = getListingId(listing);
  const localMetadata = getLocalListingMetadata(listingId);

  return (
    localMetadata.pickUpLocation ||
    (typeof listing.pickUpLocation === "string"
      ? listing.pickUpLocation
      : listing.pickUpLocation?.name) ||
    listing.location ||
    listing.pickupLocation ||
    ""
  );
};

const getListingStatus = (listing: any) => {
  const status = String(listing?.status || "available").toLowerCase();

  if (status === "sold_pending" || status === "pending") return "sold_pending";

  if (status === "completed" || status === "complete" || status === "sold") {
    return "completed";
  }

  return "available";
};

const getListingUpdatedTime = (listing: any) => {
  const dateValue =
    listing.updatedAt ||
    listing.updated_at ||
    listing.createdAt ||
    listing.created_at;

  const time = new Date(dateValue).getTime();

  return Number.isNaN(time) ? 0 : time;
};

const normalizeListings = (data: any) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.listings)) return data.listings;
  if (Array.isArray(data.data)) return data.data;
  return [];
};

const normalizeCategories = (data: any) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.categories)) return data.categories;
  if (Array.isArray(data.data)) return data.data;
  return [];
};

const getCategoryOptionName = (category: any) => {
  return normalizeCategoryName(category?.name || category);
};

const Browse = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [priceFilter, setPriceFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("latest");
  const [listings, setListings] = useState<any[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<any[]>([]);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPageData() {
      try {
        setLoading(true);
        setError("");

        const [listingsData, blockedData, categoriesData] = await Promise.all([
          getListings(),
          getBlockedUsers().catch(() => []),
          getCategories().catch(() => []),
        ]);

        const normalizedListings = normalizeListings(listingsData);
        const normalizedCategories = normalizeCategories(categoriesData);

        const fullListings = await Promise.all(
          normalizedListings.map(async (listing: any) => {
            const listingId = getListingId(listing);

            if (!listingId) {
              return listing;
            }

            try {
              const detailData = await getListingById(String(listingId));
              return detailData.listing || detailData;
            } catch (err) {
              console.warn("Failed to load listing detail:", listingId, err);
              return listing;
            }
          })
        );

        const normalizedBlocked = Array.isArray(blockedData)
          ? blockedData
          : Array.isArray((blockedData as any).blocks)
          ? (blockedData as any).blocks
          : [];

        const blockedIds = normalizedBlocked
          .map(
            (item: any) =>
              item?.user?.id ||
              item?.user?.userId ||
              item?.blocked?.id ||
              item?.blocked?.userId ||
              item?.blockedId
          )
          .filter(Boolean)
          .map((id: any) => String(id));

        setListings(fullListings);
        setCategoryOptions(normalizedCategories);
        setBlockedUserIds(blockedIds);
      } catch (err: any) {
        console.error("Failed to load listings:", err);
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
          listing.seller?.userId ||
          listing.userId ||
          listing.ownerId ||
          ""
      );

      const status = getListingStatus(listing);

      return !blockedUserIds.includes(sellerId) && status !== "completed";
    });
  }, [listings, blockedUserIds]);

  const categories = useMemo(() => {
    const apiCategoryNames = categoryOptions
      .map((item) => getCategoryOptionName(item))
      .filter(Boolean)
      .filter((name) => name !== "Uncategorized");

    const listingCategoryNames = visibleListings
      .map((listing) => getListingCategory(listing))
      .filter(Boolean)
      .filter((name) => name !== "Uncategorized");

    const names = Array.from(
      new Set([...apiCategoryNames, ...listingCategoryNames])
    ).sort((a, b) => a.localeCompare(b));

    return ["All", ...names];
  }, [categoryOptions, visibleListings]);

  const filtered = visibleListings
    .filter((listing) => {
      const title = (listing.title || listing.name || "").toLowerCase();
      const description = (listing.description || "").toLowerCase();
      const location = getListingLocation(listing).toLowerCase();

      const listingCategory = getListingCategory(listing);

      const price =
        listing.price === null || listing.price === undefined
          ? 0
          : Number(listing.price);

      const searchValue = search.toLowerCase();

      const matchSearch =
        title.includes(searchValue) ||
        description.includes(searchValue) ||
        location.includes(searchValue);

      const matchCategory = category === "All" || listingCategory === category;

      const matchPrice =
        priceFilter === "all" ||
        (priceFilter === "free" && price === 0) ||
        (priceFilter === "under20" && price > 0 && price < 20) ||
        (priceFilter === "under50" && price > 0 && price < 50) ||
        (priceFilter === "under100" && price > 0 && price < 100) ||
        (priceFilter === "over100" && price >= 100);

      return matchSearch && matchCategory && matchPrice;
    })
    .sort((a, b) => {
      const aTime = getListingUpdatedTime(a);
      const bTime = getListingUpdatedTime(b);

      if (sortOrder === "earliest") {
        return aTime - bTime;
      }

      return bTime - aTime;
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

          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-full sm:w-48 h-11">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="latest">Latest to earliest</SelectItem>
              <SelectItem value="earliest">Earliest to latest</SelectItem>
            </SelectContent>
          </Select>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-44 h-11">
              <SelectValue placeholder="All" />
            </SelectTrigger>

            <SelectContent>
              {categories.map((categoryName) => (
                <SelectItem key={categoryName} value={categoryName}>
                  {categoryName}
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
                <ListingCard key={getListingId(listing)} listing={listing} />
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