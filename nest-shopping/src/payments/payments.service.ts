import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Order } from 'src/orders/entity/order.entity';
import { ConfirmPaymenyDto } from './dto/payment.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PaymentsService {

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
    ) { }


    async confirmPayment(
        confirmPaymentDto: ConfirmPaymenyDto
    ): Promise<any> {
        const { paymentKey, orderNumber, amount } = confirmPaymentDto;

        const url = 'https://api.tosspayments.com/v1/payments/confirm';
        const tossSecretKey = this.configService.get<string>('TOSS_SECRET_KEY', '');
        const basicToken = Buffer.from(`${tossSecretKey}:`).toString('base64');

        const response = await firstValueFrom(
            this.httpService.post(
                // URL, 어디로
                url,
                // data, 무엇을
                {
                    paymentKey,
                    orderId: orderNumber,
                    amount
                },
                // config - 옵션, 어떻게
                {
                    headers: {
                        Authorization: `Basic ${basicToken}`,
                        'Content-Type': 'application/json',
                    }
                }
            )
        );
        const payment = response.data;
        if (payment.status !== 'DONE') throw new BadRequestException('결제 승인에 실패했습니다.');

        return payment;

    }

    async cancelPayment(order: Order, cancelReason?: string): Promise<any> {

        if (!order.paymentKey) throw new BadRequestException('결제 정보가 없어 취소할 수 없습니다.');

        const url = `https://api.tosspayments.com/v1/payments/${order.paymentKey}/cancel`;
        const tossSecretKey = this.configService.get<string>('TOSS_SECRET_KEY', '');
        const basicToken = Buffer.from(`${tossSecretKey}:`).toString('base64');

        const response = await firstValueFrom(
            this.httpService.post(
                url,
                { cancelReason: cancelReason ?? '사용자 요청 취소', },
                {
                    headers: {
                        Authorization: `Basic ${basicToken}`,
                        'Content-Type': 'application/json',
                    }
                }
            )
        );

        const payment = response.data;
        if (payment.status !== 'CANCELED') throw new BadRequestException('결제 취소에 실패했습니다.');

        return payment;
    }
}
