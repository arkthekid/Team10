import { Link } from "react-router-dom";

interface ListingCardProps {
  listing: any;
}

const getListingImage = (listing: any) => {
  const firstImage = Array.isArray(listing.images)
    ? listing.images[0]?.url ||
      listing.images[0]?.imageUrl ||
      listing.images[0]?.publicUrl ||
      listing.images[0]
    : undefined;

  return (
    listing.image ||
    listing.imageUrl ||
    listing.photoUrl ||
    listing.photo ||
    listing.listingImage ||
    firstImage ||
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80"
  );
};

const ListingCard = ({ listing }: ListingCardProps) => {
  const id = listing.listingId || listing.id || listing.productId || listing._id;
  const title = listing.name || listing.title || "Untitled Listing";
  const image = getListingImage(listing);

  const price =
    listing.price === null || listing.price === undefined
      ? null
      : Number(listing.price);

  const location =
    listing.pickUpLocation || listing.location || "Pickup location not provided";

  return (
    <Link
      to={`/listing/${id}`}
      className="group bg-card rounded-lg border overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80";
          }}
        />
      </div>

      <div className="p-3">
        <p className="font-bold text-card-foreground">
          {price === null || Number(price) === 0
            ? "FREE"
            : `$${price.toLocaleString()}`}
        </p>

        <p className="text-sm text-card-foreground truncate">{title}</p>

        <p className="text-xs text-muted-foreground mt-1">{location}</p>
      </div>
    </Link>
  );
};

export default ListingCard;