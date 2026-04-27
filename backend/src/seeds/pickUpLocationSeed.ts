import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();

import { AppDataSource } from "../config/data-source";
import { pickUpLocation } from "../entities/pickUpLocation";

const residentialLocations = [
  "Orchard Hill",
  "Southwest Residential Area",
  "Sylvan Residential Area",
  "Berkshire Residential Area",
  "Central Residential Area",
];

const diningLocations = [
  "Worcester Dining Commons",
  "Franklin Dining Commons",
  "Hampshire Dining Commons",
  "Berkshire Dining Commons",
];

const campusLocations = [
  "W.E.B. Du Bois Library",
  "Student Union",
  "Recreation Center",
  "Campus Pond",
  "Integrative Learning Center",
  "Fine Arts Center",
];

const seed = async () => {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(pickUpLocation);

  const allLocations = [...residentialLocations, ...diningLocations, ...campusLocations];

  for (const name of allLocations) {
    const existing = await repo.findOne({ where: { name } });
    if (!existing) {
      const location = repo.create({ name });
      await repo.save(location);
      console.log(`✅ Added: ${name}`);
    } else {
      console.log(`⏭ Skipped (already exists): ${name}`);
    }
  }

  await AppDataSource.destroy();
};

seed();