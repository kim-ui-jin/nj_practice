import { BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order } from './entity/order.entity';
import { OrderItem } from './entity/order-item.entity';
import { Cart } from 'src/cart/entity/cart.entity';
import { CreateOrderDto } from './dto/order.dto';
import { randomUUID } from 'crypto';
import { CartItem, GetCompleteOrder, OrderSummary } from './type/order.type';
import { OrderStatus } from 'src/common/enums/order-status.enum';
import { PaymentsService } from 'src/payments/payments.service';
import { CancelPaymentDto, ConfirmPaymenyDto } from 'src/payments/dto/payment.dto';
import { Product } from 'src/products/entity/product.entity';
import { CommonResponse } from 'src/common/common-response';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order) private readonly orderRepository: Repository<Order>,
        @InjectRepository(OrderItem) private readonly orderItemRepository: Repository<OrderItem>,
        @InjectRepository(Cart) private readonly cartRepository: Repository<Cart>,
        @InjectRepository(Product) private readonly productRepository: Repository<Product>,
        private readonly paymentsService: PaymentsService,
        private readonly dataSource: DataSource
    ) { }

    // 배송비 계산
    private calShippingFee(itemsTotal: number): number {
        return itemsTotal >= 50000 ? 0 : 3500;
    }

    // 주문 생성
    async createOrder(
        userSeq: number,
        createOrderDto: CreateOrderDto
    ): Promise<CommonResponse<Order>> {

        const { cartSeqList,
            receiverName,
            receiverPhone,
            zipCode,
            address1,
            address2,
            memo
        } = createOrderDto;

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
            .andWhere('cart.seq IN (:...cartSeqList)', { cartSeqList })
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

        try {

            const savedOrder = await this.dataSource.transaction(async (manager) => {

                const orderRepo = manager.getRepository(Order);
                const orderItemRepo = manager.getRepository(OrderItem);

                const order = orderRepo.create({
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

                const createdOrder = await this.orderRepository.save(order);

                const orderItemsData = cartItems.map((item) => ({
                    order: savedOrder,
                    product: { seq: item.productSeq },
                    productName: item.name,
                    unitPrice: item.price,
                    quantity: item.quantity,
                    lineTotal: Number(item.lineTotal),
                }));

                const orderItems = orderItemRepo.create(orderItemsData);
                await orderItemRepo.save(orderItems);

                return createdOrder;
            })

            return {
                success: true,
                message: '주문이 생성되었습니다.',
                data: savedOrder
            };

        } catch (e) {

            console.error('주문 처리 중 에러:', e);
            throw new InternalServerErrorException('주문 처리 중 오류가 발생했습니다.');

        }

    }

    // 완료된 주문 보기
    async getCompleteOrder(
        userSeq: number,
        orderNumber: string,
    ): Promise<CommonResponse<GetCompleteOrder>> {

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
            .andWhere('order.status = :status', { status: OrderStatus.PAID })
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
            success: true,
            message: '주문 상세 정보를 불러왔습니다.',
            data: {
                ...orderInfo,
                items
            }
        };
    }

    // 주문 승인
    async confirmOrder(
        userSeq: number,
        confirmPaymentDto: ConfirmPaymenyDto,
    ): Promise<CommonResponse<void>> {

        const { orderNumber,
            paymentKey,
            amount,
            cartSeqList
        } = confirmPaymentDto;

        const order = await this.orderRepository.findOne({
            where: {
                orderNumber,
                user: { seq: userSeq }
            }
        });

        if (!order) throw new NotFoundException('주문 내역을 찾을 수 없습니다.');
        if (order.status !== OrderStatus.PENDING) {
            throw new BadRequestException('결제할 수 없는 주문 상태입니다.');
        }
        if (order.orderTotal !== amount) {
            throw new BadRequestException('결제 금액이 주문 금액과 일치하지 않습니다.');
        }

        const payment = await this.paymentsService.confirmPayment(confirmPaymentDto);

        order.status = OrderStatus.PAID;
        order.pgProvider = 'toss';
        order.paymentKey = paymentKey;
        order.paidAt = new Date(payment.approvedAt);

        await this.decreaseStock(order);

        try {

            await this.orderRepository.save(order);
            await this.cartRepository.delete(cartSeqList);

        } catch (e) {

            throw new InternalServerErrorException('주문 승인 처리 중 오류가 발생했습니다.');

        }

        return {
            success: true,
            message: '주문이 정상적으로 승인되었습니다.'
        };

    }

    // 재고 차감
    async decreaseStock(
        order: Order
    ) {
        const orderItems = await this.orderItemRepository.find({
            where: {
                order: { seq: order.seq },
            },
            relations: ['product']
        });

        for (const item of orderItems) {
            const product = item.product;
            if (!product) {
                throw new NotFoundException('주문 상품 정보를 찾을 수 없습니다.');
            }
            if (product.stockQuantity < item.quantity) {
                throw new BadRequestException('상품 재고가 부족합니다.');
            }
            product.stockQuantity -= item.quantity;
            await this.productRepository.save(product);
        }
    }

    // 결제 취소
    async cancelOrder(
        userSeq: number,
        cancelPaymentDto: CancelPaymentDto,
    ): Promise<CommonResponse<void>> {

        try {

            const { orderNumber, cancelReason } = cancelPaymentDto;

            const order = await this.orderRepository.findOne({
                where: {
                    orderNumber,
                    user: { seq: userSeq },
                }
            });
            if (!order) throw new NotFoundException('주문 내역을 찾을 수 없습니다.');
            if (order.status === OrderStatus.CANCELED) {
                throw new BadRequestException('이미 취소된 주문입니다.');
            }
            if (order.status === OrderStatus.PENDING) {
                order.status = OrderStatus.CANCELED;
                await this.orderRepository.save(order);

                return {
                    success: true,
                    message: '주문이 정상적으로 취소되었습니다.'
                };
            }
            if (order.status !== OrderStatus.PAID) {
                throw new BadRequestException('취소할 수 없는 주문 상태입니다.');
            }

            await this.paymentsService.cancelPayment(order, cancelReason);
            order.status = OrderStatus.CANCELED;
            await this.orderRepository.save(order);

            return {
                success: true,
                message: '결제가 정상적으로 취소되었습니다.'
            };

        } catch (e) {
            if (e instanceof HttpException) throw e;
            throw new InternalServerErrorException('결제 취소 처리 중 오류가 발생했습니다.');
        }

    }
}
