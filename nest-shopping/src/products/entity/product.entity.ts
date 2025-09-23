import { Transform } from "class-transformer";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone"
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "src/user/entity/user.entity";
dayjs.extend(utc);
dayjs.extend(tz);

@Entity('products')
export class Product {

    @PrimaryGeneratedColumn()
    seq: number;

    // 상품명
    @Column({ type: 'varchar', length: 120 })
    name: string;

    // 가격
    @Column({ type: 'int', unsigned: true })
    price: number;

    // 재고 수량
    @Column({ type: 'int', default: 0, unsigned: true })
    stockQuantity: number;

    // 설명
    @Column({ type: 'text', nullable: true })
    description: string | null;

    @CreateDateColumn()
    @Transform(
        ({ value }) => dayjs(value).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
        { toPlainOnly: true }
    )
    createdAt: Date;

    @UpdateDateColumn()
    @Transform(
        ({ value }) => dayjs(value).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
        { toPlainOnly: true }
    )
    updatedAt: Date;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'created_by_user_id', referencedColumnName: 'userId' })
    creator: User;

}