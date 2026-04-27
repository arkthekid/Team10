import { AppDataSource } from "../config/data-source";
import { AppError } from "../utils/AppError";
import { pickUpLocation } from "../entities/pickUpLocation";

const getRepo = () => AppDataSource.getRepository(pickUpLocation);

export async function createPickUpLocation(name: string) {
  const repo = getRepo();

  const existing = await repo.findOne({ where: { name } });
  if (existing) {
    throw new AppError("Pick up location already exists", 409);
  }

  const location = repo.create({ name });
  await repo.save(location);

  return location;
}

export async function getAllPickUpLocations() {
  const repo = getRepo();
  return await repo.find({ order: { name: "ASC" } });
}

export async function getPickUpLocationById(locationId: string) {
  const repo = getRepo();

  const location = await repo.findOne({ where: { locationId } });
  if (!location) {
    throw new AppError("Pick up location not found", 404);
  }

  return location;
}

export async function updatePickUpLocation(locationId: string, name: string) {
  const repo = getRepo();

  const location = await repo.findOne({ where: { locationId } });
  if (!location) {
    throw new AppError("Pick up location not found", 404);
  }

  location.name = name;
  await repo.save(location);

  return location;
}

export async function deletePickUpLocation(locationId: string) {
  const repo = getRepo();

  const location = await repo.findOne({ where: { locationId } });
  if (!location) {
    throw new AppError("Pick up location not found", 404);
  }

  await repo.remove(location);

  return { message: "Pick up location deleted successfully" };
}