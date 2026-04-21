import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Conversation } from "./Conversation";
import { User } from "./User";

@Entity()
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("text")
  conversationId!: string;

  @Column("text")
  senderId!: string;

  @Column("text")
  body!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Conversation, (conv) => conv.messages)
  @JoinColumn({ name: "conversationId" })
  conversation!: Conversation;

  @ManyToOne(() => User)
  @JoinColumn({ name: "senderId" })
  sender!: User;
}