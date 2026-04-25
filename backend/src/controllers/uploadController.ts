// src/controllers/uploadController.ts
import { NextFunction, Request, Response } from "express";
import * as imageService from "../services/uploadService";
import multer from "multer";

export const upload = multer({ storage: multer.memoryStorage() });

export const uploadListingImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { listingId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!listingId || Array.isArray(listingId)) return res.status(400).json({ message: "Missing listing ID or invalid listing ID!"});

    if (!files || files.length == 0) {
      return res.status(400).json({ message: "No file provided" });
    }

    const mapped = files.map((f) => ({
      buffer: f.buffer,
      fileName: f.originalname,
      mimeType: f.mimetype
    }))

    const images = await imageService.uploadImages(listingId, mapped);
    return res.status(200).json({ images });
  } catch (err) {
    return res.status(500).json({ message: "Upload failed" });
  }
};

export async function deleteListingImage(req: Request, res: Response, next: NextFunction) {
  try {
    const { imageId } = req.params;
    if (!imageId || Array.isArray(imageId)) return res.status(400).json({message: "Missing or invalid image ID!"});
    await imageService.deleteListingImage(imageId);
    return res.status(200).send()
  }
  catch (error) {
    next(error);
  }
}