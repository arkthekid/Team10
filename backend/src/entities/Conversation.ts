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
  conversationId!: string;

  @Column("text")
  buyerId!: string;

  @Column("text")
  sellerId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column("text")
  listingId!: string;

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