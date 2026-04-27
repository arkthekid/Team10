import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany
} from "typeorm";
import { Category } from "../constants/categories";
import { User } from "./User";
import { Conversation } from "./Conversation";
import { CategoryEntity } from "./Category";
import { ListingImage } from "./ListingImage";
import { pickUpLocation } from "./pickUpLocation";

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

  @Column({ type: "text", default: "available" })
  status!: ListingStatus;

  @Column({ type: "timestamp", nullable: true })
  sellerMarkedSoldAt!: Date | null;

  @Column({ type: "timestamp", nullable: true })
  buyerMarkedReceivedAt!: Date | null;

  @Column({ type: "text", nullable: true })
  pickUpLocationId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column("text")
  sellerId!: string;

  @Column("text", { nullable: true })
  buyerId?: string;

  @ManyToOne(() => User, (user) => user.listings)
  @JoinColumn({ name: "sellerId" })
  seller!: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "buyerId" })
  buyer?: User;

  @OneToMany(() => Conversation, (conversation) => conversation.listing, { nullable: true })
  conversations!: Conversation[];

  @ManyToMany(() => CategoryEntity, (category) => category.listings)
  @JoinTable()
  categories!: Category[];

  @OneToMany(() => ListingImage, (images) => images.listing, { cascade: true, eager: true })
  images!: ListingImage[];

  @ManyToOne(() => pickUpLocation, (pickUpLocation: pickUpLocation) => pickUpLocation.listings)
  @JoinColumn({ name: "pickUpLocationId" })
  pickUpLocation!: pickUpLocation;
}
