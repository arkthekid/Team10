import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();

import { AppDataSource } from "../config/data-source";
import { CategoryEntity } from "../entities/Category";

const categories = [
  "Electronic",
  "Book",
  "Furniture",
  "Clothing",
  "Appliance",
  "Stationery",
  "Transportation",
  "Other",
];

const seed = async () => {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(CategoryEntity);

  for (const name of categories) {
    const existing = await repo.findOne({ where: { name } });
    if (!existing) {
      const category = repo.create({ name });
      await repo.save(category);
      console.log(`✅ Added: ${name}`);
    } else {
      console.log(`⏭ Skipped (already exists): ${name}`);
    }
  }

  await AppDataSource.destroy();
};

seed();