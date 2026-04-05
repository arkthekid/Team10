import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Category } from "../constants/categories";

@Entity()
export class Listing {
  @PrimaryGeneratedColumn("uuid")
  listingId!: string;

  @Column("text")
  name!: string;

  @Column("text")
  sellerId!: string;

  @Column("text")
  pickUpLocation!: string;

  @Column("text")
  description!: string;

  @Column("decimal")
  price!: number;

  @Column("text")
  condition!: string;

  @Column({ type: "text", default: "available" })
  status!: string;

  @Column("text")
  category!: Category;

  @Column("text", { nullable: true })
  imageUrl?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}