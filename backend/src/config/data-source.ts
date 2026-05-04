import "dotenv/config";
import { DataSource } from "typeorm";
import { Listing } from "../entities/Listing";
import { ListingImage } from "../entities/ListingImage";
import { User } from "../entities/User";
import { Favorite } from "../entities/Favorite";
import { Block } from "../entities/Block";
import { Report } from "../entities/Report";
import { Conversation } from "../entities/Conversation";
import { Message } from "../entities/Message";
import { CategoryEntity } from "../entities/Category";
import { pickUpLocation } from "../entities/pickUpLocation";
import { Review } from "../entities/Review";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER ?? "postgres",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "mydb",
  ssl: { rejectUnauthorized: false },
  synchronize: false,
  logging: false,

  entities: [Listing, ListingImage, User, Conversation, Message, CategoryEntity, 
    pickUpLocation, Review, Report, Favorite, Block],

});