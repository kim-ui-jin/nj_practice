import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from 'src/orders/entity/order.entity';
import { Repository } from 'typeorm';
import { ConfirmPaymenyDto } from './dto/confirm-payment.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PaymentsService {

    constructor(
        @InjectRepository(Order) private readonly orderRepository: Repository<Order>,
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
    ) { }

    async confirmPayment(
        userSeq: number,
        confirmPaymentDto: ConfirmPaymenyDto
    ) {

        const { orderNumber, paymentKey, amount } = confirmPaymentDto;

        const order = await this.orderRepository.findOne({
            where: {
                orderNumber,
                user: { seq: userSeq },
            },
        });
        if (!order) throw new NotFoundException('주문 내역을 찾을 수 없습니다.');
        if (order.status === 'PAID') throw new BadRequestException('이미 결제가 완료된 주문입니다.');
        if (order.orderTotal !== amount) throw new BadRequestException('결제 금액이 주문 금액과 일치하지 않습니다.');

        const url = 'https://api.tosspayments.com/v1/payments/confirm';

        const tossSecretkey = this.configService.get<string>('TOSS_SECRET_KEY', '');

        const basicToken = Buffer.from(`${tossSecretkey}:`).toString('base64');

        const response = await firstValueFrom(
            this.httpService.post(
                url,
                {
                    paymentKey,
                    orderId: orderNumber,
                    amount,
                },
                {
                    headers: {
                        Authorization: `Basic ${basicToken}`,
                        'Content-Type': 'application/json',
                    },
                },
            ),
        );

        const payment = response.data;

        if (payment.status !== 'DONE') throw new BadRequestException('결제 승인에 실패했습니다.');

        order.status = 'PAID';
        order.pgProvider = 'toss';
        order.paymentKey = paymentKey;
        order.paidAt = new Date(payment.approvedAt);

        await this.orderRepository.save(order);

        return {
            orderNumber: order.orderNumber,
            status: order.status,
            amount: order.orderTotal,
            payment,
        };

    }
}
