import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Listing } from "./Listing";
import { Message } from "./Message";

@Entity()
export class Conversation {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("text")
  listingId!: string;

  @Column("text")
  buyerId!: string;

  @Column("text")
  sellerId!: string;

  @Column({ type: "boolean", default: false })
  isArchived!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Listing)
  @JoinColumn({ name: "listingId" })
  listing!: Listing;

  @ManyToOne(() => User)
  @JoinColumn({ name: "buyerId" })
  buyer!: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: "sellerId" })
  seller!: User;

  @OneToMany(() => Message, (message: Message) => message.conversation)
  messages!: Message[];
}