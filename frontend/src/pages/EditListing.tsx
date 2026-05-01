import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MarketplaceHeader from "@/components/MarketplaceHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  getCategories,
  getListingById,
  getPickUpLocations,
  updateListing,
} from "../lib/listingApi";

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

const saveListingMetadata = (
  listingId: string,
  metadata: {
    category: string;
    categoryId: string;
    pickUpLocation: string;
    pickUpLocationId: string;
  }
) => {
  try {
    const savedMetadata = JSON.parse(
      localStorage.getItem("listingMetadata") || "{}"
    );

    savedMetadata[String(listingId)] = metadata;

    localStorage.setItem("listingMetadata", JSON.stringify(savedMetadata));
  } catch {
    localStorage.setItem(
      "listingMetadata",
      JSON.stringify({ [String(listingId)]: metadata })
    );
  }
};

const getListingCategory = (listing: any, localMetadata: any) => {
  return (
    localMetadata.category ||
    (Array.isArray(listing.categories) && listing.categories.length > 0
      ? listing.categories[0]
      : "") ||
    listing.category ||
    listing.categoryName ||
    listing.categoryType ||
    listing.listingCategory ||
    listing.category?.name ||
    listing.category?.label ||
    listing.category?.value ||
    ""
  );
};

const getListingPickUpLocation = (listing: any, localMetadata: any) => {
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

const EditListing = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const [category, setCategory] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<any[]>([]);

  const [pickUpLocation, setPickUpLocation] = useState("");
  const [pickUpLocationId, setPickUpLocationId] = useState("");
  const [pickUpLocationOptions, setPickUpLocationOptions] = useState<any[]>([]);

  const [condition, setCondition] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    async function loadData() {
      if (!id) return;

      try {
        setLoading(true);

        const [listingResponse, categoriesResponse, locationsResponse] =
          await Promise.all([
            getListingById(id),
            getCategories(),
            getPickUpLocations(),
          ]);

        const listing = listingResponse.listing || listingResponse;
        const localMetadata = getLocalListingMetadata(id);

        const loadedCategories = Array.isArray(categoriesResponse)
          ? categoriesResponse
          : Array.isArray(categoriesResponse.categories)
          ? categoriesResponse.categories
          : Array.isArray(categoriesResponse.data)
          ? categoriesResponse.data
          : [];

        const loadedLocations = Array.isArray(locationsResponse)
          ? locationsResponse
          : Array.isArray(locationsResponse.locations)
          ? locationsResponse.locations
          : Array.isArray(locationsResponse.pickUpLocations)
          ? locationsResponse.pickUpLocations
          : Array.isArray(locationsResponse.data)
          ? locationsResponse.data
          : [];

        setCategoryOptions(loadedCategories);
        setPickUpLocationOptions(loadedLocations);

        const listingCategory = getListingCategory(listing, localMetadata);
        const listingLocation = getListingPickUpLocation(listing, localMetadata);

        const matchedCategory = loadedCategories.find((option: any) => {
          const name = option.name || "";
          const optionId = option.categoryId || option.id || option._id;
          return (
            name === listingCategory ||
            String(optionId) === String(localMetadata.categoryId)
          );
        });

        const matchedLocation = loadedLocations.find((option: any) => {
          const name = option.name || "";
          const optionId =
            option.locationId ||
            option.pickUpLocationId ||
            option.id ||
            option._id;

          return (
            name === listingLocation ||
            String(optionId) === String(localMetadata.pickUpLocationId)
          );
        });

        setName(listing.name || listing.title || "");
        setPrice(
          listing.price === null || listing.price === undefined
            ? ""
            : String(Number(listing.price))
        );

        setCategory(listingCategory);
        setCategoryId(
          matchedCategory
            ? String(
                matchedCategory.categoryId ||
                  matchedCategory.id ||
                  matchedCategory._id
              )
            : localMetadata.categoryId || ""
        );

        setPickUpLocation(listingLocation);
        setPickUpLocationId(
          matchedLocation
            ? String(
                matchedLocation.locationId ||
                  matchedLocation.pickUpLocationId ||
                  matchedLocation.id ||
                  matchedLocation._id
              )
            : localMetadata.pickUpLocationId || ""
        );

        setCondition(listing.condition || "");
        setDescription(listing.description || "");

        setImageUrl(
          listing.imageUrl ||
            listing.image ||
            listing.photoUrl ||
            listing.photo ||
            listing.listingImage ||
            listing.images?.[0]?.url ||
            listing.images?.[0]?.imageUrl ||
            ""
        );
      } catch (err: any) {
        toast.error(err.message || "Failed to load listing");
        navigate("/browse");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, navigate]);

  const handleCategoryChange = (selectedId: string) => {
    setCategoryId(selectedId);

    const selectedCategory = categoryOptions.find((option) => {
      const optionId = option.categoryId || option.id || option._id;
      return String(optionId) === String(selectedId);
    });

    setCategory(selectedCategory?.name || "");
  };

  const handlePickUpLocationChange = (selectedId: string) => {
    setPickUpLocationId(selectedId);

    const selectedLocation = pickUpLocationOptions.find((option) => {
      const optionId =
        option.locationId ||
        option.pickUpLocationId ||
        option.id ||
        option._id;

      return String(optionId) === String(selectedId);
    });

    setPickUpLocation(selectedLocation?.name || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    if (!name.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!pickUpLocationId || !pickUpLocation) {
      toast.error("Pick-up location is required");
      return;
    }

    if (!categoryId || !category) {
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
      price.trim() === "" ? null : Number.parseFloat(price.trim());

    if (
      price.trim() !== "" &&
      (Number.isNaN(numericPrice) || numericPrice < 0)
    ) {
      toast.error("Price must be a valid number");
      return;
    }

    try {
      setSaving(true);

      await updateListing(id, {
        name: name.trim(),
        price: numericPrice,
        category,
        categoryIds: [categoryId],
        pickUpLocation,
        pickUpLocationId,
        condition: condition.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim() || undefined,
      });

      saveListingMetadata(id, {
        category,
        categoryId,
        pickUpLocation,
        pickUpLocationId,
      });

      toast.success("Listing updated successfully");
      navigate(`/listing/${id}`);
    } catch (err: any) {
      console.error("UPDATE LISTING ERROR:", err);
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
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Leave empty for free"
            />
          </div>

          <div>
            <label className="block text-lg font-medium mb-2">Category</label>
            <select
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select category</option>
              {categoryOptions.map((option) => {
                const optionId = option.categoryId || option.id || option._id;
                const name = option.name || "Unnamed category";

                return (
                  <option key={String(optionId)} value={String(optionId)}>
                    {name}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-lg font-medium mb-2">
              Pick-up Location
            </label>
            <select
              value={pickUpLocationId}
              onChange={(e) => handlePickUpLocationChange(e.target.value)}
              className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select pick-up location</option>
              {pickUpLocationOptions.map((option) => {
                const optionId =
                  option.locationId ||
                  option.pickUpLocationId ||
                  option.id ||
                  option._id;

                const name = option.name || "Unnamed location";

                return (
                  <option key={String(optionId)} value={String(optionId)}>
                    {name}
                  </option>
                );
              })}
            </select>
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