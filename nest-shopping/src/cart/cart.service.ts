import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { AddToCartDto, UpdateQuantityDto } from './dto/cart.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/products/entity/product.entity';
import { Repository } from 'typeorm';
import { Cart } from './entity/cart.entity';
import { CartItem, GetCartItems } from 'src/orders/type/order.type';
import { CommonResponse } from 'src/common/common-response';

@Injectable()
export class CartService {

    constructor(
        @InjectRepository(Product) private readonly productRepository: Repository<Product>,
        @InjectRepository(Cart) private readonly cartRepository: Repository<Cart>,
    ) { }

    // 배송비 계산
    private calShippingFee(itemsTotal: number): number {
        return itemsTotal >= 50000 ? 0 : 3500;
    }

    //상품을 장바구니에 담기
    async addItem(
        userSeq: number,
        addToCartDto: AddToCartDto
    ): Promise<CommonResponse<{ productSeq: number; quantity: number }>> {

        const { productSeq, quantity } = addToCartDto;


        const product = await this.productRepository.findOne({
            where: { seq: productSeq },
            select: { stockQuantity: true }
        });
        if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');
        if (product.stockQuantity <= 0) throw new BadRequestException('해당 상품은 품절입니다.');
        if (quantity > product.stockQuantity) {
            throw new BadRequestException('재고 수량을 초과했습니다.');
        }

        const exist = await this.cartRepository.exists({
            where: {
                user: { seq: userSeq },
                product: { seq: productSeq }
            }
        });
        if (exist) throw new BadRequestException('이미 장바구니에 해당 상품이 있습니다.');

        try {
            await this.cartRepository.insert({
                user: { seq: userSeq },
                product: { seq: productSeq },
                quantity,
            });
        } catch (e) {
            throw new InternalServerErrorException('장바구니 담기 중 오류가 발생했습니다.');
        }

        return {
            success: true,
            message: '장바구니에 상품이 추가되었습니다.',
            data: { productSeq, quantity }
        };

    }

    // 장바구니 목록 조회
    async getCartItems(
        userSeq: number
    ): Promise<CommonResponse<GetCartItems>> {

        const cartItems: CartItem[] = await this.cartRepository
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
                '(cart.quantity * product.price) AS lineTotal'
            ])
            .where('cart.user_seq = :userSeq', { userSeq })
            .orderBy('cart.seq', 'DESC')
            .getRawMany();

        if (cartItems.length === 0) {
            return {
                success: true,
                message: '장바구니가 비어 있습니다.',
                data: {
                    cartItems: [],
                    itemsTotal: 0,
                    shippingFee: 0,
                    orderTotal: 0,
                }
            };
        }

        // 상품 금액 합계
        const itemsTotal = cartItems.reduce((acc, row) => acc + Number(row.lineTotal), 0);
        // 배송비
        const shippingFee = this.calShippingFee(itemsTotal);
        // 총 결제 금액
        const orderTotal = itemsTotal + shippingFee;

        return {
            success: true,
            message: '장바구니 조회 성공',
            data: {
                cartItems,
                itemsTotal,
                shippingFee,
                orderTotal
            }
        };
    }

    // 장바구니 등록 취소
    async removeCartItem(
        userSeq: number,
        productSeq: number
    ): Promise<CommonResponse<void>> {

        const result = await this.cartRepository.delete({
            user: { seq: userSeq },
            product: { seq: productSeq },
        });
        if (!result.affected) {
            throw new NotFoundException('장바구니에 해당 상품이 없습니다.');
        }

        return {
            success: true,
            message: '장바구니에서 상품을 제거했습니다.'
        };

    }

    // 장바구니 전체 비우기
    async clearCartItems(
        userSeq: number
    ): Promise<CommonResponse<void>> {

        const exist = this.cartRepository.exists({
            where: { user: { seq: userSeq } }
        });
        if (!exist) throw new BadRequestException('이미 비어 있는 장바구니입니다.');

        await this.cartRepository.delete({
            user: { seq: userSeq }
        });

        return {
            success: true,
            message: '장바구니를 비웠습니다.'
        };

    }

    // 수량 변경
    async updateQuantity(
        userSeq: number,
        updateQuantityDto: UpdateQuantityDto
    ): Promise<CommonResponse<{ productSeq: number; newQuantity: number }>> {

        const { productSeq, newQuantity } = updateQuantityDto;

        const product = await this.productRepository.findOne({
            where: { seq: productSeq },
            select: { stockQuantity: true },
        });
        if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');
        if (newQuantity > product.stockQuantity) {
            throw new BadRequestException('재고 수량을 초과했습니다.');
        }

        const updated = await this.cartRepository.update(
            {
                user: { seq: userSeq },
                product: { seq: productSeq }
            },
            { quantity: newQuantity },
        );

        if (!updated.affected) {
            const exist = await this.cartRepository.exists({
                where: {
                    user: { seq: userSeq },
                    product: { seq: productSeq }
                },
            });
            if (!exist) {
                throw new NotFoundException('장바구니에 해당 상품이 없습니다.');
            }
        }

        return {
            success: true,
            message: '장바구니 수량이 변경되었습니다.',
            data: {
                productSeq,
                newQuantity
            }
        };

    }
}
