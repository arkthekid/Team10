import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { Listing } from "./Listing";

@Entity()
export class CategoryEntity {
    @PrimaryGeneratedColumn("uuid")
    categoryId!: string;

    @Column("text")
    name!: string;

    @ManyToMany(() => Listing, (listing: Listing) => listing.categories)
    listings!: Listing[];
}

