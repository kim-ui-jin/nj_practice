import { Column, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { UserAuthority } from "./user-authority.entity";
import { UserStatus } from "src/common/enums/user-status.enum";

@Entity('users')
export class User {

    @PrimaryGeneratedColumn()
    seq: number;

    @Column({ type: 'varchar', length: 10, nullable: false, unique: true })
    userId: string;

    @Column({ type: 'char', length: 60, nullable: false, select: false })
    userPassword: string;

    @Column({ type: 'varchar', length: 20, nullable: false })
    userName: string;

    @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
    userEmail: string;

    @Column({ type: 'varchar', length: 20, nullable: false })
    userPhone: string;

    @OneToMany(() => UserAuthority, (ua) => ua.user, {
        eager: true,
        cascade: ['insert'],
    })
    authorities?: UserAuthority[];

    @Column({ type: 'char', length: 60, nullable: true, select: false })
    refreshTokenHash: string | null;

    @Column({ type: 'varchar', length: 255, nullable: false })
    userAddress: string;

    @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
    status: UserStatus;

    @DeleteDateColumn({ type: 'datetime', precision: 0, nullable: true })
    deletedAt: Date | null;
}