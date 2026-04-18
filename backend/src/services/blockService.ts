import { AppDataSource } from "../config/data-source";
import { AppError } from "../utils/AppError";
import { Block } from "../entities/Block";
import { User } from "../entities/User";

export async function blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) {
    throw new AppError("You cannot block yourself", 400);
  }

  const blockRepo = AppDataSource.getRepository(Block);
  const userRepo = AppDataSource.getRepository(User);

  const userToBlock = await userRepo.findOne({
    where: { id: blockedId },
  });

  if (!userToBlock) {
    throw new AppError("User not found", 404);
  }

  const existingBlock = await blockRepo.findOne({
    where: { blockerId, blockedId },
  });

  if (existingBlock) {
    throw new AppError("User is already blocked", 409);
  }

  const block = blockRepo.create({
    blockerId,
    blockedId,
  });

  await blockRepo.save(block);

  return {
    message: "User blocked successfully",
    block,
  };
}

export async function getMyBlockedUsers(blockerId: string) {
  const blockRepo = AppDataSource.getRepository(Block);

  const blocks = await blockRepo.find({
    where: { blockerId },
    relations: ["blocked"],
    order: { createdAt: "DESC" },
  });

  return blocks.map((block) => ({
    id: block.id,
    blockedAt: block.createdAt,
    user: {
      id: block.blocked.id,
      name: block.blocked.name,
      umassEmail: block.blocked.umassEmail,
      role: block.blocked.role,
    },
  }));
}

export async function unblockUser(blockerId: string, blockedId: string) {
  const blockRepo = AppDataSource.getRepository(Block);

  const block = await blockRepo.findOne({
    where: { blockerId, blockedId },
  });

  if (!block) {
    throw new AppError("Block not found", 404);
  }

  await blockRepo.remove(block);

  return { message: "User unblocked successfully" };
}