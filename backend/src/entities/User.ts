// src/entities/User.ts
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  umassEmail!: string;  

  @Column()
  passwordHash!: string; 

  @Column({ default: "user" })
  role!: "user" | "admin"; // ensures only "user" or "admin" roles are allowed (used in JWT and future auth checks)
}