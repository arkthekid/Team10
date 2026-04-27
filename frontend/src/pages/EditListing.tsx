import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MarketplaceHeader from "@/components/MarketplaceHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getListingById, updateListing } from "../lib/listingApi";

const EditListing = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [pickUpLocation, setPickUpLocation] = useState("");
  const [condition, setCondition] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    async function loadListing() {
      if (!id) return;

      try {
        setLoading(true);
        const data = await getListingById(id);
        const listing = data.listing || data;

        setName(listing.name || listing.title || "");
        setPrice(
          listing.price === null || listing.price === undefined
            ? ""
            : String(Number(listing.price))
        );
        setCategory(listing.category || "");
        setPickUpLocation(listing.pickUpLocation || listing.location || "");
        setCondition(listing.condition || "");
        setDescription(listing.description || "");
        setImageUrl(
          listing.imageUrl ||
            listing.image ||
            listing.photoUrl ||
            listing.photo ||
            listing.listingImage ||
            ""
        );
      } catch (err: any) {
        toast.error(err.message || "Failed to load listing");
        navigate("/browse");
      } finally {
        setLoading(false);
      }
    }

    loadListing();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    if (!name.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!pickUpLocation.trim()) {
      toast.error("Pick-up location is required");
      return;
    }

    if (!category.trim()) {
      toast.error("Category is required");
      return;
    }

    if (!condition.trim()) {
      toast.error("Condition is required");
      return;
    }

    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }

    const numericPrice =
      price.trim() === "" ? null : Number.parseInt(price.trim(), 10);

    if (price.trim() !== "" && (Number.isNaN(numericPrice) || numericPrice < 0)) {
      toast.error("Price must be a valid whole number");
      return;
    }

    try {
      setSaving(true);

      await updateListing(id, {
        name: name.trim(),
        price: numericPrice,
        category: category.trim(),
        pickUpLocation: pickUpLocation.trim(),
        condition: condition.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim() || undefined,
      });

      toast.success("Listing updated successfully");
      navigate(`/listing/${id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update listing");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <MarketplaceHeader />
        <main className="flex-1 max-w-3xl mx-auto w-full p-6">
          <p>Loading listing...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MarketplaceHeader />

      <main className="flex-1 max-w-3xl mx-auto w-full p-6">
        <h1 className="text-4xl font-bold mb-8">Edit Listing</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-lg font-medium mb-2">Title</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Listing title"
            />
          </div>

          <div>
            <label className="block text-lg font-medium mb-2">Price ($)</label>
            <Input
              type="number"
              min="0"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Leave empty for free"
            />
          </div>

          <div>
            <label className="block text-lg font-medium mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select category</option>
              <option value="General">General</option>
              <option value="Books">Books</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Furniture">Furniture</option>
              <option value="Housing">Housing</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-lg font-medium mb-2">
              Pick-up Location
            </label>
            <Input
              value={pickUpLocation}
              onChange={(e) => setPickUpLocation(e.target.value)}
              placeholder="e.g. Brett Hall"
            />
          </div>

          <div>
            <label className="block text-lg font-medium mb-2">Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select condition</option>
              <option value="New">New</option>
              <option value="Like New">Like New</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Used">Used</option>
            </select>
          </div>

          <div>
            <label className="block text-lg font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-36 rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Describe your listing"
            />
          </div>

          <div>
            <label className="block text-lg font-medium mb-2">Image URL</label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Optional image URL"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12"
              onClick={() => navigate(`/listing/${id}`)}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={saving} className="w-full h-12">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default EditListing;