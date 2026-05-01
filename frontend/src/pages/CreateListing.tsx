import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import MarketplaceHeader from "@/components/MarketplaceHeader";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ImagePlus, X } from "lucide-react";
import {
  createListing,
  getCategories,
  getPickUpLocations,
} from "../lib/listingApi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const CreateListing = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");

  const [categoryId, setCategoryId] = useState("");
  const [category, setCategory] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<any[]>([]);

  const [pickUpLocationId, setPickUpLocationId] = useState("");
  const [pickUpLocation, setPickUpLocation] = useState("");
  const [pickUpLocationOptions, setPickUpLocationOptions] = useState<any[]>([]);

  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [showPublishWarning, setShowPublishWarning] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        setCategoriesLoading(true);

        const data = await getCategories();

        const loadedCategories = Array.isArray(data)
          ? data
          : Array.isArray(data.categories)
          ? data.categories
          : Array.isArray(data.data)
          ? data.data
          : [];

        setCategoryOptions(loadedCategories);
      } catch (err) {
        console.error("CATEGORY LOAD ERROR:", err);
        toast.error("Failed to load categories");
        setCategoryOptions([]);
      } finally {
        setCategoriesLoading(false);
      }
    }

    async function loadPickUpLocations() {
      try {
        setLocationsLoading(true);

        const data = await getPickUpLocations();

        const loadedLocations = Array.isArray(data)
          ? data
          : Array.isArray(data.locations)
          ? data.locations
          : Array.isArray(data.pickUpLocations)
          ? data.pickUpLocations
          : Array.isArray(data.data)
          ? data.data
          : [];

        setPickUpLocationOptions(loadedLocations);
      } catch (err) {
        console.error("PICKUP LOCATIONS ERROR:", err);
        toast.error("Failed to load pick-up locations");
        setPickUpLocationOptions([]);
      } finally {
        setLocationsLoading(false);
      }
    }

    loadCategories();
    loadPickUpLocations();
  }, []);

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

  const handleCategoryChange = (selectedId: string) => {
    setCategoryId(selectedId);

    const selectedCategory = categoryOptions.find((option) => {
      const id = option.categoryId || option.id || option._id;
      return String(id) === String(selectedId);
    });

    setCategory(selectedCategory?.name || "");
  };

  const handlePickUpLocationChange = (selectedId: string) => {
    setPickUpLocationId(selectedId);

    const selectedLocation = pickUpLocationOptions.find((option) => {
      const id =
        option.locationId ||
        option.pickUpLocationId ||
        option.id ||
        option._id;

      return String(id) === String(selectedId);
    });

    setPickUpLocation(selectedLocation?.name || "");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPreviewUrls: string[] = [];
    const newFiles: File[] = [];

    Array.from(files).forEach((file) => {
      if (newPreviewUrls.length + images.length >= 5) return;

      newPreviewUrls.push(URL.createObjectURL(file));
      newFiles.push(file);
    });

    setImages((prev) => [...prev, ...newPreviewUrls].slice(0, 5));
    setImageFiles((prev) => [...prev, ...newFiles].slice(0, 5));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadListingImages = async (listingId: string, files: File[]) => {
    if (files.length === 0) return;

    const formData = new FormData();

    files.slice(0, 5).forEach((file) => {
      formData.append("images", file);
    });

    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/listings/${listingId}/images`, {
      method: "POST",
      body: formData,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const text = await response.text();
    let data: any = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    console.log("UPLOAD STATUS:", response.status);
    console.log("UPLOAD RESPONSE:", data);

    if (!response.ok) {
      throw new Error(data.message || data.error || "Image upload failed");
    }

    return data;
  };

  const getCreatedListingId = (result: any) => {
    return (
      result?.listingId ||
      result?.id ||
      result?._id ||
      result?.listing?.listingId ||
      result?.listing?.id ||
      result?.listing?._id ||
      result?.data?.listingId ||
      result?.data?.id ||
      result?.data?._id ||
      result?.data?.listing?.listingId ||
      result?.data?.listing?.id ||
      result?.data?.listing?._id
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!categoryId || !category) {
      toast.error("Category is required");
      return;
    }

    if (!pickUpLocationId || !pickUpLocation) {
      toast.error("Pick-up location is required");
      return;
    }

    if (!condition) {
      toast.error("Condition is required");
      return;
    }

    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }

    const numericPrice =
      price.trim() === "" ? 0 : Number.parseFloat(price.trim());

    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      toast.error("Price must be a valid number");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: title.trim(),
        title: title.trim(),
        description: description.trim(),
        price: numericPrice,
        pickUpLocation,
        pickUpLocationId,
        location: pickUpLocation,
        condition,
        category,
        categoryIds: [categoryId],
        images: [],
        imageUrls: [],
      };

      console.log("LISTING PAYLOAD:", payload);

      const result = await createListing(payload);

      console.log("CREATE LISTING RESPONSE:", result);

      const listingId = getCreatedListingId(result);

      if (listingId) {
        saveListingMetadata(String(listingId), {
          category,
          categoryId,
          pickUpLocation,
          pickUpLocationId,
        });
      }

      if (imageFiles.length > 0 && listingId) {
        await uploadListingImages(listingId, imageFiles);
      }

      if (imageFiles.length > 0 && !listingId) {
        console.warn(
          "Listing created, but no listingId was returned for image upload."
        );
      }

      toast.success("Listing created successfully!");
      navigate("/browse");
    } catch (err: any) {
      console.error("CREATE LISTING ERROR:", err);
      toast.error(err.message || "Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MarketplaceHeader />

      <main className="flex-1 max-w-lg mx-auto w-full p-4 md:p-6">
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Create New Listing
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setShowPublishWarning(true);
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Leave empty for free"
            />
          </div>

          <div>
            <Label>Category</Label>
            <Select
              value={categoryId}
              onValueChange={handleCategoryChange}
              required
              disabled={categoriesLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    categoriesLoading
                      ? "Loading categories..."
                      : "Select category"
                  }
                />
              </SelectTrigger>

              <SelectContent>
                {categoryOptions.map((option) => {
                  const id = option.categoryId || option.id || option._id;
                  const name = option.name || "Unnamed category";

                  return (
                    <SelectItem key={String(id)} value={String(id)}>
                      {name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Pick-up Location</Label>
            <Select
              value={pickUpLocationId}
              onValueChange={handlePickUpLocationChange}
              required
              disabled={locationsLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    locationsLoading
                      ? "Loading pick-up locations..."
                      : "Select pick-up location"
                  }
                />
              </SelectTrigger>

              <SelectContent>
                {pickUpLocationOptions.map((option) => {
                  const id =
                    option.locationId ||
                    option.pickUpLocationId ||
                    option.id ||
                    option._id;

                  const name = option.name || "Unnamed location";

                  return (
                    <SelectItem key={String(id)} value={String(id)}>
                      {name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Condition</Label>
            <Select value={condition} onValueChange={setCondition} required>
              <SelectTrigger>
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Used">Used</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div>
            <Label>Photos (up to 5)</Label>

            <div className="flex flex-wrap gap-3 mt-2">
              {images.map((src, i) => (
                <div
                  key={i}
                  className="relative w-20 h-20 rounded-md overflow-hidden border border-border"
                >
                  <img
                    src={src}
                    alt={`Upload ${i + 1}`}
                    className="w-full h-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-0.5 right-0.5 bg-background/80 rounded-full p-0.5"
                  >
                    <X className="w-3.5 h-3.5 text-foreground" />
                  </button>
                </div>
              ))}

              {images.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-md border-2 border-dashed border-muted-foreground/40 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <ImagePlus className="w-5 h-5" />
                  <span className="text-[10px] mt-1">Add</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Publishing..." : "Publish Listing"}
          </Button>
        </form>
      </main>

      {showPublishWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-background border shadow-xl p-6">
            <h3 className="text-xl font-bold mb-3">
              Prohibited Item Warning
            </h3>

            <p className="text-sm text-muted-foreground leading-6 mb-4">
              UMass Marketplace does not allow listings for illegal items,
              drugs, weapons, alcohol, counterfeit goods, stolen property, or
              any item that violates university policy or the law.
            </p>

            <p className="text-sm text-muted-foreground leading-6 mb-6">
              By continuing, you confirm that your listing follows these rules.
              Violations may result in the listing being removed, your account
              being reported, and further action being taken.
            </p>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowPublishWarning(false)}
                disabled={loading}
              >
                Cancel
              </Button>

              <Button
                type="button"
                className="w-full"
                onClick={() => {
                  setShowPublishWarning(false);
                  handleSubmit();
                }}
                disabled={loading}
              >
                I Understand
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateListing;