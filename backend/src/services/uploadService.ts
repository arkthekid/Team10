// src/services/uploadService.ts
import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";
import { ListingImage } from "../entities/ListingImage";
import { Listing } from "../entities/Listing";
import { AppDataSource } from "../config/data-source";

const listingRepo = AppDataSource.getRepository(Listing);
const listingImageRepo = AppDataSource.getRepository(ListingImage);

async function uploadImageToStorage(
  file: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const filePath = `listings/${Date.now()}_${fileName}`;

  const { error } = await supabase.storage
    .from("listing-images")
    .upload(filePath, file, {
      contentType: mimeType,
      upsert: false, // no overwrite if file exists
    });

  if (error) throw new AppError("Image upload failed", 500);

  // get public URL
  const { data } = supabase.storage
    .from("listing-images")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function uploadImages(
  listingId: string,
  files: { buffer: Buffer, fileName: string, mimeType: string }[]
): Promise<ListingImage[]> {
  const listing = await listingRepo.findOne({ where: { listingId }});
  if (!listing) throw new AppError("Listing not found", 404);

  const urls = await Promise.all(
    files.map((f) => uploadImageToStorage(f.buffer, f.fileName, f.mimeType))
  );

  const images = urls.map(
    (url) => {
      const image = new ListingImage();
      image.url = url;
      image.listing = listing;
      return image;
    }
  )

  return listingImageRepo.save(images);
}

export async function deleteListingImage(imageId: string): Promise<void> {
  const image = await listingImageRepo.findOneBy({ imageId });
  if (!image) throw new AppError("Cannot find image", 404);

  const filePath = image.url.split("/listing-images/")[1];
  if (!filePath) throw new AppError("Invalid image URL", 400);
  await supabase.storage.from("listing-images").remove([filePath]);

  await listingImageRepo.delete({ imageId })
}