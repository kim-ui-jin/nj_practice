import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./order.entity";
import { Product } from "src/products/entity/product.entity";

@Entity('order_items')
export class OrderItem {
    @PrimaryGeneratedColumn()
    seq: number;

    @ManyToOne(() => Order, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'order_seq', referencedColumnName: 'seq' })
    order: Order;

    @ManyToOne(() => Product, { nullable: false })
    @JoinColumn({ name: 'product_seq', referencedColumnName: 'seq' })
    product: Product;

    // 주문 시점의 상품명
    @Column({ type: 'varchar', length: 100, nullable: false })
    productName: string;

    // 주문 시점의 상품 단가
    @Column({ type: 'int', unsigned: true, nullable: false })
    unitPrice: number;

    // 주문 수량
    @Column({ type: 'int', unsigned: true, nullable: false })
    quantity: number;

    // 총 금액 (단가 * 수량 (unitPrice*quantity))
    @Column({ type: 'int', unsigned: true, nullable: false })
    lineTotal: number;
}