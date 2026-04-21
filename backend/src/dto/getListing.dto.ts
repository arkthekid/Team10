export interface GetListingDto {
    search?: string;
    category?: string; // undefined != optional
    sortBy?: "price" | "createdAt";
    order?: "ASC" | "DESC";
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
    imageUrl?: string | null;
}