import { Transform } from "class-transformer";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone"
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "src/user/entity/user.entity";
import { ProductStatus } from "src/common/enums/product-status.enum";
dayjs.extend(utc);
dayjs.extend(tz);

@Entity('products')
export class Product {

    @PrimaryGeneratedColumn()
    seq: number;

    // 상품명
    @Column({ type: 'varchar', length: 100, nullable: false })
    name: string;

    // 가격
    @Column({ type: 'int', unsigned: true, nullable: false })
    price: number;

    // 재고 수량
    @Column({ type: 'int', default: 0, unsigned: true })
    stockQuantity: number;

    // 설명
    @Column({ type: 'varchar', length: 500, nullable: true })
    description: string | null;

    // 썸네일
    @Column({ type: 'varchar', length: 512, nullable: true })
    thumbnailUrl: string | null;

    // 이미지
    @Column({ type: 'json', nullable: true })
    imageUrls: string[] | null;

    @CreateDateColumn({ type: 'timestamp', precision: 0, default: () => 'CURRENT_TIMESTAMP'})
    @Transform(
        ({ value }) => dayjs(value).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
        { toPlainOnly: true }
    )
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp', precision: 0, default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    @Transform(
        ({ value }) => dayjs(value).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
        { toPlainOnly: true }
    )
    updatedAt: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'created_by_user_seq', referencedColumnName: 'seq' })
    creator: User;

    @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.INACTIVE})
    status: ProductStatus;

}