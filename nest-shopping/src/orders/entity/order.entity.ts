import { Transform } from "class-transformer";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone"
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrderItem } from "./order-item.entity";
import { User } from "src/user/entity/user.entity";
dayjs.extend(utc);
dayjs.extend(tz);

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn()
    seq: number;

    // 주문 번호(UUID)
    @Column({ type: 'char', length: 40, unique: true, nullable: false })
    orderNumber: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'user_seq', referencedColumnName: 'seq' })
    user: User;

    // 상품 금액 합계
    @Column({ type: 'int', unsigned: true, nullable: false, default: 0 })
    itemsTotal: number;

    // 배송비
    @Column({ type: 'int', unsigned: true, nullable: false, default: 0 })
    shippingFee: number;

    // 총 결제 금액 (상품 금액 합계 + 배송비)
    @Column({ type: 'int', unsigned: true, nullable: false, default: 0 })
    orderTotal: number;

    // 수령인 이름
    @Column({ type: 'varchar', length: 20, nullable: false })
    receiverName: string;

    // 수령인 연락처
    @Column({ type: 'varchar', length: 20, nullable: false })
    receiverPhone: string;

    // 우편 번호
    @Column({ type: 'char', length: 5, nullable: false })
    zipCode: string;

    // 기본 주소
    @Column({ type: 'varchar', length: 200, nullable: false })
    address1: string;

    // 상세 주소
    @Column({ type: 'varchar', length: 200, nullable: true })
    address2: string | null;

    // 배송 메모
    @Column({ type: 'varchar', length: 200, nullable: true })
    memo: string | null;

    // 주문 생성 시간
    @CreateDateColumn({ type: 'timestamp', precision: 0, default: () => 'CURRENT_TIMESTAMP' })
    @Transform(
        ({ value }) => dayjs(value).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
        { toPlainOnly: true }
    )
    createdAt: Date;

    // 주문 품목 리스트
    @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
    items: OrderItem[];

    // 결재 상태 (PENDING: 주문만 생성, PAID: 결재 완료, CANCELED: 결재 취소, FAILED: 결재 실패)
    @Column({ type: 'char', length: 10, nullable: false, default: 'PENDING' })
    status: 'PENDING' | 'PAID' | 'CANCELED' | 'FAILED';

    // PG사 이름
    @Column({ type: 'varchar', length: 20, nullable: true })
    pgProvider: string | null;

    // payment 키
    @Column({ type: 'varchar', length: 100, nullable: true })
    paymentKey: string | null;

    // 결재 완료 시각
    @Column({ type: 'timestamp', nullable: true })
    paidAt: Date | null;
}