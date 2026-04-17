// src/entities/User.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Listing } from "./Listing"
import { Favorite } from "./Favorite";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("text")
  name!: string;

  @Column("text", { unique: true })
  umassEmail!: string;  

  @Column("text")
  passwordHash!: string; 

  @Column("text", { default: "user" })
  role!: "user" | "admin";

  @Column({ type: "boolean", default: false })
  isVerified!: boolean;

  @Column({ type: "text", nullable: true })
  verificationToken!: string | null;

  @OneToMany(() => Listing, (listing) => listing.seller)
  listings!: Listing[];

  @OneToMany(() => Listing, (listing) => listing.buyer)
  purchases!: Listing[];

  @OneToMany(() => Favorite, (favorite) => favorite.userId)
  favorites!: Favorite[];
}