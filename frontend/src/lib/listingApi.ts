import { apiFetch } from "./api";

export async function getListings() {
  return apiFetch("/listings");
}

export async function getListingById(id: string) {
  return apiFetch(`/listings/${id}`);
}

export async function getMyListings() {
  return apiFetch("/listings/me");
}

export async function getCategories() {
  return apiFetch("/categories");
}

export async function getPickUpLocations() {
  return apiFetch("/pick-up-locations");
}

export async function createListing(listingData: {
  name: string;
  title?: string;
  description: string;
  price: number | null;
  pickUpLocation?: string;
  pickUpLocationId?: string | null;
  location?: string;
  condition: string;
  category: string;
  categoryIds: string[];
  images: any[];
  imageUrls: string[];
  imageUrl?: string;
}) {
  return apiFetch("/listings", {
    method: "POST",
    body: JSON.stringify(listingData),
  });
}

export async function updateListing(
  id: string,
  listingData: {
    name: string;
    description: string;
    price: number | null;
    pickUpLocation: string;
    pickUpLocationId?: string | null;
    condition: string;
    category: string;
    categoryIds?: string[];
    imageUrl?: string;
  }
) {
  return apiFetch(`/listings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(listingData),
  });
}

async function deleteListingImage(imageId: string) {
  return apiFetch(`/listings/images/${imageId}`, {
    method: "DELETE",
  });
}

function getImageId(image: any) {
  return (
    image?.imageId ||
    image?.id ||
    image?._id ||
    image?.listingImageId ||
    ""
  );
}

export async function deleteListing(id: string) {
  try {
    const listingData = await getListingById(id);
    const listing = listingData.listing || listingData;

    const images = Array.isArray(listing.images) ? listing.images : [];

    for (const image of images) {
      const imageId = getImageId(image);

      if (imageId) {
        try {
          await deleteListingImage(imageId);
        } catch (err) {
          console.warn("Failed to delete listing image:", imageId, err);
        }
      }
    }

    return apiFetch(`/listings/${id}`, {
      method: "DELETE",
    });
  } catch (err) {
    console.error("DELETE LISTING ERROR:", err);
    throw err;
  }
}