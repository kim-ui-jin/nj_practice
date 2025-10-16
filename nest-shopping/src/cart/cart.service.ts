import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AddToCartDto } from './dto/cart.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/products/entity/product.entity';
import { Repository } from 'typeorm';
import { Cart } from './entity/cart.entity';

@Injectable()
export class CartService {

    constructor(
        @InjectRepository(Product) private readonly productRepository: Repository<Product>,
        @InjectRepository(Cart) private readonly cartRepository: Repository<Cart>,
    ) { }

    //상품을 장바구니에 담기
    async addItem(userSeq: number, addToCartDto: AddToCartDto): Promise<void> {

        const { productSeq, quantity } = addToCartDto;

        const product = await this.productRepository.findOne({ where: { seq: productSeq } });
        if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');
        if (product.stockQuantity <= 0) throw new BadRequestException('해당 상품은 품절입니다.');

        const result = await this.cartRepository
            .createQueryBuilder()
            .update(Cart)
            .set({ quantity: () => `quantity + ${quantity}` })
            .where('user_seq = :userSeq AND product_seq = :productSeq', { userSeq, productSeq })
            .execute();

        if (result.affected === 0) {
            await this.cartRepository.insert({
                user: { seq: userSeq },
                product: { seq: productSeq },
                quantity,
            });
        }

        // const list = await this.productCartRepository.find({
        //     where: { user: { seq: userSeq } },
        //     relations: { product: true },
        //     order: { seq: 'DESC' },
        // });

        // return list

    }
}
