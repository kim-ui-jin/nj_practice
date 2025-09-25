import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity('user_authority')
export class UserAuthority {

    @PrimaryGeneratedColumn()
    seq: number;

    @Column()
    authorityName: string;

    @ManyToOne(() => User, (user) => user.authorities, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_seq', referencedColumnName: 'seq' })
    user: User;
}