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
  role!: string;  // 👈 added role
}