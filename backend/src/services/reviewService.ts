import { AppDataSource } from "../config/data-source";
import { Review } from "../entities/Review";
import { User } from "../entities/User";
import { AppError } from "../utils/AppError";

const getRepo = () => AppDataSource.getRepository(Review);
const getUserRepo = () => AppDataSource.getRepository(User);