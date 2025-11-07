import { BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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
    async addItem(userSeq: number, addToCartDto: AddToCartDto) {

        const { productSeq, quantity } = addToCartDto;

        try {
            const product = await this.productRepository.findOne({ where: { seq: productSeq } });
            if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');
            if (product.stockQuantity <= 0) throw new BadRequestException('해당 상품은 품절입니다.');

            const exist = await this.cartRepository.findOne({
                where: { user: { seq: userSeq }, product: { seq: productSeq } },
                select: { seq: true, quantity: true },
            });
            if (exist) throw new BadRequestException('이미 장바구니에 해당 상품이 있습니다.');

            if (quantity > product.stockQuantity) {
                throw new BadRequestException('재고 수량을 초과했습니다.');
            }

            await this.cartRepository.insert({
                user: { seq: userSeq },
                product: { seq: productSeq },
                quantity,
            });
        } catch (e) {
            if (e instanceof HttpException) throw e;
            throw new InternalServerErrorException('장바구니 담기 중 오류가 발생했습니다.');
        }

        return { productSeq, quantity };

    }

    // 장바구니 목록 조회
    async getCartItems(userSeq: number) {
        const list = await this.cartRepository
            .createQueryBuilder('cart')
            // FROM cart AS cart
            // INNER JOIN products AS product
            // ON product.seq = cart.product_seq
            .innerJoin('cart.product', 'product')
            .select([
                'cart.seq AS cartSeq',
                'cart.quantity AS quantity',
                'product.seq AS productSeq',
                'product.name AS name',
                'product.price AS price',
                'product.thumbnailUrl AS thumbnailUrl',
                '(cart.quantity * product.price) AS itemTotal'
            ])
            .where('cart.user_seq = :userSeq', { userSeq })
            .orderBy('cart.seq', 'DESC')
            .getRawMany<{
                cartSeq: number;
                quantity: number;
                productSeq: number;
                name: string;
                price: number;
                thumbnailUrl: string | null;
                itemTotal: number;
            }>();

        const itemsTotal = list.reduce((acc, row) => acc + Number(row.itemTotal), 0);

        return { list, itemsTotal };
    }

    // 장바구니 등록 취소
    async removeCartItem(userSeq: number, productSeq: number) {

        try {
            const result = await this.cartRepository.delete({
                user: { seq: userSeq },
                product: { seq: productSeq },
            });
            if (result.affected === 0) {
                throw new NotFoundException('장바구니에 해당 상품이 없습니다.');
            }
        } catch (e) {
            if (e instanceof HttpException) throw e;
            throw new InternalServerErrorException('장바구니 삭제 중 오류가 발생했습니다.');
        }

    }

    // 장바구니 전체 비우기
    async clearCartItems(userSeq: number) {

        try {
            await this.cartRepository.delete({ user: { seq: userSeq } });
        } catch (e) {
            throw new InternalServerErrorException('장바구니 비우기 중 오류가 발생했습니다.');
        }

    }
}
