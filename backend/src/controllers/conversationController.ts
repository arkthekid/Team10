import { Request, Response, NextFunction } from "express";
import * as conversationService from "../services/conversationService";
import { getUserId } from "../utils/getUserId";


export const markAsSold = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sellerId = getUserId(req);
    const conversationId = req.params.conversationId as string;

    const updatedListing = await conversationService.markAsSold(sellerId, conversationId);

    res.status(200).json(updatedListing);
  }
  catch (error) {
    next(error);
  }
}

export const markAsComplete = async (req: Request, res: Response, next: NextFunction) => {

}