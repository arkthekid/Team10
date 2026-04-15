import "dotenv/config";
import { DataSource } from "typeorm";
import { Listing } from "../entities/Listing";
import { User } from "../entities/User";
import { Favorite } from "../entities/Favorite";

console.log("DATABASE_URL:", process.env.DATABASE_URL);

export const AppDataSource = new DataSource({
  type: "postgres",
  
  // host: process.env.DB_HOST ?? "localhost",
  // port: Number(process.env.DB_PORT) || 5432,
  // username: process.env.DB_USER ?? "postgres",
  // password: process.env.DB_PASSWORD ?? "",
  // database: process.env.DB_NAME ?? "mydb",
  url: process.env.DATABASE_URL!,

  ssl: { rejectUnauthorized: false }, // 👈 add this for cloud DBs

  synchronize: true, // ✅ CHANGED: disable in production (use migrations instead)
  logging: false,
  entities: [Listing, User, Favorite],
});