import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from "typeorm";
import { Category } from "../constants/categories";
import { User } from "./User"
import { Conversation } from "./Conversation";

export type ListingStatus = "available" | "sold_pending" | "completed";

@Entity()
export class Listing {
  @PrimaryGeneratedColumn("uuid")
  listingId!: string;

  @Column("text")
  name!: string;

  @Column("decimal")
  price!: number;

  @Column("text")
  description!: string;

  @Column("text")
  condition!: string;

  @Column("text")
  category!: Category;

  @Column({type: "text", default: "available"})
  status!: ListingStatus;

  @Column({type: "timestamp", nullable: true})
  sellerMarkedSoldAt!: Date | null;

  @Column({type: "timestamp", nullable: true})
  buyerMarkedReceivedAt!: Date | null;

  @Column("text")
  pickUpLocation!: string;

  @Column("text", { nullable: true })
  imageUrl!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // buyer and seller
  @Column("text")
  sellerId!: string;

  @ManyToOne(() => User, (user) => user.listings)
  @JoinColumn({ name: "sellerId"})
  seller!: User;

  @Column("text")
  buyerId!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "buyerId" })
  buyer?: User;

  // conversation
  @ManyToOne(() => Conversation, (convesation) => convesation.listing)
  conversation?: Conversation;
}
