import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { User } from "./User";
import { Listing } from "./Listing";

@Entity()
@Unique(["userId", "listingId"])
export class Favorite {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("text")
  userId!: string;

  @Column("text")
  listingId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @ManyToOne(() => Listing, { onDelete: "CASCADE" })
  @JoinColumn({ name: "listingId", referencedColumnName: "listingId" })
  listing!: Listing;

  @CreateDateColumn()
  createdAt!: Date;
}