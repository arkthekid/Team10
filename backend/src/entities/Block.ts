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

@Entity()
@Unique(["blockerId", "blockedId"])
export class Block {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("text")
  blockerId!: string;

  @Column("text")
  blockedId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "blockerId", referencedColumnName: "id" })
  blocker!: User;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "blockedId", referencedColumnName: "id" })
  blocked!: User;

  @CreateDateColumn()
  createdAt!: Date;
}