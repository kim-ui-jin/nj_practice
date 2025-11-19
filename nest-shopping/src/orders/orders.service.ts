import { BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entity/order.entity';
import { OrderItem } from './entity/order-item.entity';
import { Cart } from 'src/cart/entity/cart.entity';
import { CreateOrderDto } from './dto/order.dto';
import { randomUUID } from 'crypto';
import { CartItem, GetCompleteOrder, OrderPreview, OrderSummary } from './type/order.type';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order) private readonly orderRepository: Repository<Order>,
        @InjectRepository(OrderItem) private readonly orderItemRepository: Repository<OrderItem>,
        @InjectRepository(Cart) private readonly cartRepository: Repository<Cart>,
    ) { }

    async orderPreview(userSeq: number): Promise<OrderPreview> {

        try {

            const cartItems: CartItem[] = await this.cartRepository
                .createQueryBuilder('cart')
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

            if (cartItems.length === 0) throw new BadRequestException('장바구니에 담긴 상품이 없습니다.');

            // 상품 금액 합계
            const itemsTotal = cartItems.reduce((acc, row) => acc + Number(row.lineTotal), 0);
            if (itemsTotal <= 0) throw new BadRequestException('주문 금액이 올바르지 않습니다.');

            // 배송비
            const shippingFee = this.calShippingFee(itemsTotal);

            // 총 결제 금액
            const orderTotal = itemsTotal + shippingFee;
            if (orderTotal <= 0) throw new BadRequestException('총 결제 금액이 올바르지 않습니다.');

            return {
                cartItems,
                itemsTotal,
                shippingFee,
                orderTotal
            }

        } catch (e) {
            if (e instanceof HttpException) throw e;
            throw new InternalServerErrorException('주문 정보 조회 중 오류가 발생했습니다.');
        }

    }

    // 배송비 계산
    private calShippingFee(itemsTotal: number): number {
        return itemsTotal >= 50000 ? 0 : 3500;
    }

    // 주문 생성
    async createOrder(
        userSeq: number,
        createOrderDto: CreateOrderDto
    ): Promise<Order> {

        try {

            const cartItems: CartItem[] = await this.cartRepository
                .createQueryBuilder('cart')
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

            if (cartItems.length === 0) throw new BadRequestException('장바구니에 담긴 상품이 없습니다.');

            // 상품 금액 합계
            const itemsTotal = cartItems.reduce((acc, row) => acc + row.lineTotal, 0);
            if (itemsTotal <= 0) throw new BadRequestException('주문 금액이 올바르지 않습니다.');

            // 배송비
            const shippingFee = this.calShippingFee(itemsTotal);

            // 총 결제 금액
            const orderTotal = itemsTotal + shippingFee;
            if (orderTotal <= 0) throw new BadRequestException('총 결제 금액이 올바르지 않습니다.');

            const { receiverName, receiverPhone, zipCode,
                address1, address2, memo } = createOrderDto;

            const order = this.orderRepository.create({
                orderNumber: `ORD-${randomUUID()}`,
                user: { seq: userSeq },
                itemsTotal,
                shippingFee,
                orderTotal,
                receiverName,
                receiverPhone,
                zipCode,
                address1,
                address2: address2 || null,
                memo: memo || null,
            });
            const savedOrder = await this.orderRepository.save(order);

            const orderItemsData = cartItems.map((item) => ({
                order: savedOrder,
                product: { seq: item.productSeq },
                productName: item.name,
                unitPrice: item.price,
                quantity: item.quantity,
                lineTotal: item.lineTotal,
            }));
            const orderItems = this.orderItemRepository.create(orderItemsData);
            await this.orderItemRepository.save(orderItems);

            return savedOrder;

        } catch (e) {
            if (e instanceof HttpException) throw e;
            throw new InternalServerErrorException('주문 처리 중 오류가 발생했습니다.');
        }

    }

    async getCompleteOrder(
        userSeq: number,
        orderNumber: string,
    ): Promise<GetCompleteOrder> {
        const orderSummary: OrderSummary[] = await this.orderRepository
            .createQueryBuilder('order')
            .innerJoin('order.items', 'item')
            .select([
                'order.orderNumber AS orderNumber',
                'order.itemsTotal AS itemsTotal',
                'order.shippingFee AS shippingFee',
                'order.orderTotal As orderTotal',
                'order.receiverName AS receiverName',
                'order.receiverPhone AS receiverPhone',
                'order.address1 AS address1',
                'order.address2 AS address2',
                'order.memo AS memo',
                'order.pgProvider AS pgProvider',
                'order.createdAt AS createdAt',
                'order.paidAt AS paidAt',
                'item.seq AS itemSeq',
                'item.productName AS productName',
                'item.unitPrice AS unitPrice',
                'item.quantity AS quantity',
                'item.lineTotal AS lineTotal',
            ])
            .where('order.orderNumber = :orderNumber', { orderNumber })
            .andWhere('order.user_seq = :userSeq', { userSeq })
            .orderBy('item.seq', 'DESC')
            .getRawMany();

        if (orderSummary.length === 0) throw new NotFoundException('해당 주문을 찾을 수 없습니다.');

        const firstOrder = orderSummary[0];

        const {
            itemSeq,
            productName,
            unitPrice,
            quantity,
            lineTotal,
            ...orderInfo
        } = firstOrder;

        const items = orderSummary.map(order => ({
            itemSeq: order.itemSeq,
            productName: order.productName,
            unitPrice: order.unitPrice,
            quantity: order.quantity,
            lineTotal: order.lineTotal,
        }));

        return {
            ...orderInfo,
            items
        };
    }
}
