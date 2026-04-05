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
  price: number;
  pickUpLocation: string;
  condition: string;
  category: string;
}) {
  return apiFetch("/listings", {
    method: "POST",
    body: JSON.stringify(listingData),
  });
}

export async function deleteListing(id: string) {
  return apiFetch(`/listings/${id}`, {
    method: "DELETE",
  });
}