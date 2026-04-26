import { AppDataSource } from "../config/data-source";
import { AppError } from "../utils/AppError";
import { pickUpLocation } from "../entities/pickUpLocation";

const getRepo = () => AppDataSource.getRepository(pickUpLocation);