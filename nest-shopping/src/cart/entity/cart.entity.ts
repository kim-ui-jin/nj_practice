import { User } from "src/user/entity/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "src/products/entity/product.entity";

@Entity('cart')
export class Cart {

    @PrimaryGeneratedColumn()
    seq: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'user_seq', referencedColumnName: 'seq' })
    user: User;

    @ManyToOne(() => Product, { eager: true, nullable: true })
    @JoinColumn({ name: 'product_seq', referencedColumnName: 'seq' })
    product: Product;

    @Column({ type: 'int', unsigned: true, default: 1 })
    quantity: number;
}