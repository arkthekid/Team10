import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import MarketplaceHeader from "@/components/MarketplaceHeader";
import ListingCard from "@/components/ListingCard";
import { listings, categories } from "@/data/listings";

const Browse = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [priceFilter, setPriceFilter] = useState("all");

  const filtered = listings.filter((l) => {
    const matchSearch = l.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "All" || l.categoryId.name === category;
    const matchPrice =
      priceFilter === "all" ||
      (priceFilter === "free" && l.price === null) ||
      (priceFilter === "under20" && l.price !== null && l.price < 20) ||
      (priceFilter === "under50" && l.price !== null && l.price < 50) ||
      (priceFilter === "under100" && l.price !== null && l.price < 100) ||
      (priceFilter === "over100" && l.price !== null && l.price >= 100);
    return matchSearch && matchCategory && matchPrice;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MarketplaceHeader />
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6">
        {/* Filters */}
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
                <SelectItem key={c} value={c}>{c}</SelectItem>
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

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((listing) => (
            <ListingCard key={listing.productId} listing={listing} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground mt-12">No listings found.</p>
        )}
      </main>
    </div>
  );
};

export default Browse;
