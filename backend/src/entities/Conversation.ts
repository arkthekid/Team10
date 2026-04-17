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
<<<<<<< HEAD
  conversationId!: string;
=======
  id!: string;

  @Column("text")
  listingId!: string;
>>>>>>> 1e1330c5bca129a452dff4527f2aa4016a805df5

  @Column("text")
  buyerId!: string;

  @Column("text")
  sellerId!: string;

<<<<<<< HEAD
=======
  @Column({ default: false })
  isArchived!: boolean;

>>>>>>> 1e1330c5bca129a452dff4527f2aa4016a805df5
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

<<<<<<< HEAD
  @Column("text")
  listingId!: string;

=======
>>>>>>> 1e1330c5bca129a452dff4527f2aa4016a805df5
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