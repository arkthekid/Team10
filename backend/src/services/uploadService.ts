// src/services/uploadService.ts
import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";

export async function uploadImage(
  file: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const filePath = `listings/${Date.now()}_${fileName}`;

  const { error } = await supabase.storage
    .from("listing-images")
    .upload(filePath, file, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) throw new AppError("Image upload failed", 500);

  // get public URL
  const { data } = supabase.storage
    .from("listing-images")
    .getPublicUrl(filePath);

  return data.publicUrl;
}