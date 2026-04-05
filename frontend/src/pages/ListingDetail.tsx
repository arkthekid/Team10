import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MoreHorizontal, ArrowLeft, Flag, ShieldX, Trash2 } from "lucide-react";
import MarketplaceHeader from "@/components/MarketplaceHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getListingById, deleteListing } from "../lib/listingApi";

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadListing() {
      if (!id) return;

      try {
        setLoading(true);
        setError("");
        const data = await getListingById(id);
        setListing(data.listing || data);
      } catch (err: any) {
        setError(err.message || "Listing not found");
      } finally {
        setLoading(false);
      }
    }

    loadListing();
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

    const confirmed = window.confirm("Are you sure you want to delete this listing?");
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
  const image =
    listing.image ||
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80";
  const location = listing.pickUpLocation || listing.location || "Amherst, MA";
  const description = listing.description || "No description provided.";
  const category = listing.category || "General";
  const sellerName = listing.sellerName || listing.nameOfSeller || "Seller";

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
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-left"
                  onClick={() => {
                    setMenuOpen(false);
                    toast.info("Block seller feature coming soon");
                  }}
                >
                  <ShieldX className="w-5 h-5" />
                  <span>Block Seller</span>
                </button>

                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-left text-red-600"
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

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="rounded-2xl overflow-hidden border bg-card">
            <img
              src={image}
              alt={title}
              className="w-full aspect-square object-cover"
            />
          </div>

          <div>
            <h1 className="text-4xl font-bold mb-2">{title}</h1>

            <p className="text-2xl font-bold text-primary mb-6">
              {price === null ? "FREE" : `$${price.toLocaleString()}`}
            </p>

            <p className="text-muted-foreground mb-2">{location}</p>
            <p className="text-muted-foreground mb-2">Posted by {sellerName}</p>

            <div className="inline-block px-3 py-1 rounded-md bg-muted text-sm mb-6">
              {category}
            </div>

            <p className="text-lg leading-8 mb-10">{description}</p>

            <Button className="w-full h-14 text-lg">Message Seller</Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ListingDetail;