import { Request, Response, NextFunction } from "express";
import * as conversationService from "../services/conversationService";
import { getUserId } from "../utils/getUserId";

export const startConversation = async (req: Request<{ listingId: string }>, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const { listingId } = req.params;
    const conversation = await conversationService.startConversation(listingId, userId);
    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
};

export const getConversationsForListing = async (req: Request<{ listingId: string }>, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const { listingId } = req.params;
    const conversations = await conversationService.getConversationsForListing(listingId, userId);
    res.status(200).json(conversations);
  } catch (error) {
    next(error);
  }
};

export const getMyConversations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const conversations = await conversationService.getMyConversations(userId);
    res.status(200).json(conversations);
  } catch (error) {
    next(error);
  }
};

export const getConversationById = async (req: Request<{ conversationId: string }>, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const { conversationId } = req.params;
    const conversation = await conversationService.getConversationById(conversationId, userId);
    res.status(200).json(conversation);
  } catch (error) {
    next(error);
  }
};

export const deleteConversation = async (req: Request<{ conversationId: string }>, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const { conversationId } = req.params;
    await conversationService.deleteConversation(conversationId, userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};