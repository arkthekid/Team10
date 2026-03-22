import { Request, Response } from "express";
import Seller from "../models/Seller";

export const createSeller = async (req: Request, res: Response) => {
  try {
    const seller = await Seller.create(req.body);
    res.status(201).json(seller);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};