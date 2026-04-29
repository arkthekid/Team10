import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Listing } from "./Listing";
import { Conversation } from "./Conversation";
import {
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from "../constants/reportConstants";

@Entity()
export class Report {
  @PrimaryGeneratedColumn("uuid")
  reportId!: string;

  @Column("text")
  reporterId!: string;

  @Column("text")
  targetType!: ReportTargetType;

  @Column("text")
  reason!: ReportReason;

  @Column("text", { nullable: true })
  comments!: string | null;

  @Column("text", { default: "pending" })
  status!: ReportStatus;

  @Column("text", { nullable: true })
  reportedUserId!: string | null;

  @Column("text", { nullable: true })
  reportedListingId!: string | null;

  @Column("text", { nullable: true })
  conversationId!: string | null;

  @Column("text", { nullable: true })
  reviewedBy!: string | null;

  @Column({ type: "timestamp", nullable: true })
  reviewedAt!: Date | null;

  @Column("text", { nullable: true })
  adminNotes!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "reporterId", referencedColumnName: "id" })
  reporter!: User;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "reportedUserId", referencedColumnName: "id" })
  reportedUser!: User | null;

  @ManyToOne(() => Listing, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "reportedListingId", referencedColumnName: "listingId" })
  reportedListing!: Listing | null;

  @ManyToOne(() => Conversation, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "conversationId", referencedColumnName: "conversationId" })
  conversation!: Conversation | null;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "reviewedBy", referencedColumnName: "id" })
  reviewer!: User | null;
}