import { Product } from "src/products/entity/product.entity";
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('tags')
export class Tag {
    @PrimaryGeneratedColumn()
    seq: number;

    @Column({ type: 'varchar', length: 50, unique: true })
    tagName: string;

    @ManyToMany(() => Product, product => product.tags)
    products: Product[];
}