// src/controllers/uploadController.ts
import { Request, Response } from "express";
import { uploadImage } from "../services/uploadService";
import multer from "multer";

export const upload = multer({ storage: multer.memoryStorage() });

export const uploadListingImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const url = await uploadImage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    return res.status(200).json({ url });
  } catch (err) {
    return res.status(500).json({ message: "Upload failed" });
  }
};