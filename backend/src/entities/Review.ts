import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

@Entity()
export class Review {
  @PrimaryGeneratedColumn("uuid")
  reviewId!: string;

  @Column("text")
  reviewerId!: string;

  @Column("text")
  revieweeId!: string;

  @Column("int")
  rating!: number;

  @Column("text")
  comment!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "reviewerId", referencedColumnName: "id" })
  reviewer!: User;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "revieweeId", referencedColumnName: "id" })
  reviewee!: User;
}