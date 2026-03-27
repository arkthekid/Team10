import { Link } from "react-router-dom";
import type { Listing } from "@/data/listings";

interface ListingCardProps {
  listing: Listing;
}

const ListingCard = ({ listing }: ListingCardProps) => {
  return (
    <Link
      to={`/listing/${listing.id}`}
      className="group bg-card rounded-lg border overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={listing.image}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-3">
        <p className="font-bold text-card-foreground">
          {listing.price === null ? "FREE" : `$${listing.price.toLocaleString()}`}
        </p>
        <p className="text-sm text-card-foreground truncate">{listing.title}</p>
        <p className="text-xs text-muted-foreground mt-1">{listing.location}</p>
      </div>
    </Link>
  );
};

export default ListingCard;
