import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Listing } from "./Listing";

@Entity()
export class pickUpLocation {
    @PrimaryGeneratedColumn("uuid")
    locationId!: string;

    @Column("text")
    name!: string;

    @OneToMany(() => Listing, (listing: Listing) => listing.pickUpLocation)
    listings!: Listing[];
}

