import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class User {

    @PrimaryGeneratedColumn()
    seq: number;

    @Column({ type: 'varchar', length: 10, nullable: false, unique: true })
    userId: string;

    @Column({ type: 'varchar', length: 255, nullable: false, select: false })
    userPassword: string;

    @Column({ type: 'varchar', length: 20, nullable: false })
    userName: string;

    @Column({ type: 'varchar', length: 50, nullable: false, unique: true })
    userEmail: string;

    @Column({ type: 'varchar', length: 20, nullable: false, unique: true })
    userPhone: string;

    @Column({ type: 'varchar', length: 255, nullable: true, select: false })
    refreshTokenHash: string | null;
}