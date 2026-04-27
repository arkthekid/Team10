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

export async function createListing(listingData: {
  name: string;
  description: string;
  price: number | null;
  pickUpLocation: string;
  condition: string;
  category: string;
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
    condition: string;
    category: string;
    imageUrl?: string;
  }
) {
  return apiFetch(`/listings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(listingData),
  });
}

export async function deleteListing(id: string) {
  return apiFetch(`/listings/${id}`, {
    method: "DELETE",
  });
}