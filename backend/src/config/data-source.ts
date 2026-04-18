import "dotenv/config";
import { DataSource } from "typeorm";
import { Listing } from "../entities/Listing";
import { User } from "../entities/User";
import { Favorite } from "../entities/Favorite";
import { Block } from "../entities/Block";
import { Conversation } from "../entities/Conversation";
import { Message } from "../entities/Message";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER ?? "postgres",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "mydb",
  ssl: { rejectUnauthorized: false },
  synchronize: true,
  logging: false,

  entities: [Listing, User, Favorite, Block, Conversation, Message],

});