import { Column, Entity, JoinColumn, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { Listing } from "./Listing";

@Entity()
export class ListingImage {
    @PrimaryGeneratedColumn("uuid")
    imageId!: string;

    @Column("text")
    url!: string;

    @ManyToOne(() => Listing, (listing) => listing.images)
    @JoinColumn({ name: "listingId" })
    listing!: Listing;
}