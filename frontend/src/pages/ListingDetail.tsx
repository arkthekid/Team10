import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Flag, ShieldX } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import MarketplaceHeader from "@/components/MarketplaceHeader";
import SafetyNotice from "@/components/SafetyNotice";
import { listings } from "@/data/listings";
import { useState } from "react";
import { toast } from "sonner";

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const listing = listings.find((l) => l.productId === id);
  const [showSafety, setShowSafety] = useState(false);

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <MarketplaceHeader />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Listing not found.</p>
        </main>
      </div>
    );
  }

  const handleMessageSeller = () => {
    setShowSafety(true);
  };

  const handleSafetyAccepted = () => {
    setShowSafety(false);
    navigate("/messages");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MarketplaceHeader />
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                •••
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast.success("Listing reported. We'll review it shortly.")}>
                <Flag className="w-4 h-4 mr-2" /> Report Listing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.success(`${listing.sellerId.name} has been blocked.`)}>
                <ShieldX className="w-4 h-4 mr-2" /> Block Seller
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg border overflow-hidden">
            <img
              src={listing.image}
              alt={listing.title}
              className="w-full aspect-square object-cover"
            />
            <div className="flex gap-1 justify-center py-2">
              <span className="w-2 h-2 rounded-full bg-foreground" />
              <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{listing.title}</h2>
              <p className="text-xl font-bold text-primary mt-1">
                {listing.price === null ? "FREE" : `$${listing.price.toLocaleString()}`}
              </p>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>{listing.pickUpLocation} · {listing.postedDate}</p>
              <p>Posted by <span className="font-medium text-foreground">{listing.sellerId.name}</span></p>
              <p className="inline-block bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-xs font-medium">
                {listing.categoryId.name}
              </p>
            </div>

            <p className="text-sm text-foreground leading-relaxed">{listing.description}</p>

            <Button className="mt-auto" size="lg" onClick={handleMessageSeller}>
              Message Seller
            </Button>
          </div>
        </div>
      </main>

      <SafetyNotice open={showSafety} onAccept={handleSafetyAccepted} />
    </div>
  );
};

export default ListingDetail;
