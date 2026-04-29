import { useState, useRef } from "react";
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
import { categories } from "@/data/listings";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ImagePlus, X } from "lucide-react";
import { createListing } from "../lib/listingApi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const CreateListing = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [pickUpLocation, setPickUpLocation] = useState("");
  const [condition, setCondition] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      result?.listing?.listingId ||
      result?.listing?.id ||
      result?.data?.listingId ||
      result?.data?.id ||
      result?.data?.listing?.listingId ||
      result?.data?.listing?.id
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!category) {
      toast.error("Category is required");
      return;
    }

    if (!pickUpLocation.trim()) {
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
        description: description.trim(),
        price: numericPrice,
        pickUpLocation: pickUpLocation.trim(),
        condition,
        category,
      };

      console.log("LISTING PAYLOAD:", payload);

      const result = await createListing(payload);

      console.log("CREATE LISTING RESPONSE:", result);

      const listingId = getCreatedListingId(result);

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

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>

              <SelectContent>
                {categories
                  .filter((c) => c !== "All")
                  .map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="pickUpLocation">Pick-up Location</Label>
            <Input
              id="pickUpLocation"
              value={pickUpLocation}
              onChange={(e) => setPickUpLocation(e.target.value)}
              placeholder="e.g. Brett Hall"
              required
            />
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
    </div>
  );
};

export default CreateListing;