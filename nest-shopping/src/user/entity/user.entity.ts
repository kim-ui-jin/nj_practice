import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class User {

    @PrimaryGeneratedColumn()
    seq: number;

    @Column()
    userId: string;

    @Column()
    userPassword: string;

    @Column()
    userName: string;

    @Column()
    userEmail: string;

    @Column()
    userPhone: string;
}