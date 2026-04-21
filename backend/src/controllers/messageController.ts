import { Request, Response, NextFunction } from "express";
import * as messageService from "../services/messageService";
import { getUserId } from "../utils/getUserId";

export const getMessages = async (req: Request<{ conversationId: string }>, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const { conversationId } = req.params;
    const messages = await messageService.getMessages(conversationId, userId);
    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req: Request<{ conversationId: string }>, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const { conversationId } = req.params;
    const { body } = req.body;
    const message = await messageService.sendMessage(conversationId, userId, body);
    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req: Request<{ messageId: string }>, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const { messageId } = req.params;
    await messageService.deleteMessage(messageId, userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};