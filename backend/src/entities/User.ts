// src/entities/User.ts
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("text")
  name!: string;

  @Column("text", { unique: true })
  umassEmail!: string;  

  @Column("text")
  passwordHash!: string; 

  @Column("text", {default: "user"})
  role!: "user" | "admin"; // ensures only "user" or "admin" roles are allowed (used in JWT and future auth checks)
}