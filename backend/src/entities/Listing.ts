import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { User } from "./User";

@Entity()
export class Listing {
  @PrimaryGeneratedColumn("uuid")
  listingId!: string;

  @Column()
  name!: string;

  @Column()
  sellerId!: string;

  @Column()
  pickUpLocation!: string;

  @Column("text")
  description!: string;

  @Column("decimal")
  price!: number;

  @Column()
  condition!: string;

  @Column({ default: "available" })
  status!: string;

  @Column()
  category!: string;

  // @ManyToOne(() => User, (user) => user.listings)
  // user!: User;
}