import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { UserAuthority } from "./user-authority.entity";

@Entity('user')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    username: string;

    @Column()
    password: string;

    // eager: entity를 조회할 때 join된 데이터까지 같이 가져오는 Option
    @OneToMany(type => UserAuthority, userAuthority => userAuthority.user, { eager: true })
    authorities?: any[]; // authorities가 배열 형태로 들어가기 때문에 any[]
}