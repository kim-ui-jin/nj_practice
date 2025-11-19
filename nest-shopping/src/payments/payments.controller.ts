import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { ConfirmPaymenyDto } from './dto/confirm-payment.dto';

@Controller('payments')
export class PaymentsController {
    constructor(
        private readonly paymentsService: PaymentsService,
    ) {}

    @Post('confirm')
    @UseGuards(JwtAuthGuard)
    async confirmPayment(
        @Req() req: any,
        @Body() confirmPaymentDto: ConfirmPaymenyDto,
    ) {
        const userSeq = req.user.seq;
        return this.paymentsService.confirmPayment(userSeq, confirmPaymentDto);
    }
}
