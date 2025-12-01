import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { CreateOrderDto } from './dto/order.dto';
import { OrdersService } from './orders.service';
import { Order } from './entity/order.entity';
import { GetCompleteOrder } from './type/order.type';
import { CancelPaymentDto, ConfirmPaymenyDto } from 'src/payments/dto/payment.dto';
import { CommonResponse } from 'src/common/common-response';

@Controller('orders')
export class OrdersController {
    constructor(
        private readonly ordersService: OrdersService
    ) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    async createOrder(
        @Req() req: any,
        @Body() createOrderDto: CreateOrderDto,
    ): Promise<CommonResponse<Order>> {
        const userSeq = req.user.seq;
        return this.ordersService.createOrder(userSeq, createOrderDto);
    }

    @Post('confirm')
    @UseGuards(JwtAuthGuard)
    async confirmPayment(
        @Req() req: any,
        @Body() confirmPaymentDto: ConfirmPaymenyDto,
    ): Promise<CommonResponse<void>> {
        const userSeq = req.user.seq;
        return this.ordersService.confirmOrder(userSeq, confirmPaymentDto);
    }

    @Get(':orderNumber')
    @UseGuards(JwtAuthGuard)
    async getCompleteOrder(
        @Req() req: any,
        @Param('orderNumber') orderNumber: string,
    ): Promise<CommonResponse<GetCompleteOrder>> {
        const userSeq = req.user.seq;
        return this.ordersService.getCompleteOrder(userSeq, orderNumber);
    }

    @Post('cancel')
    @UseGuards(JwtAuthGuard)
    async cancelOrder(
        @Req() req: any,
        @Body() cancelPaymentDto: CancelPaymentDto,
    ): Promise<CommonResponse<void>> {
        const userSeq = req.user.seq;
        return this.ordersService.cancelOrder(userSeq, cancelPaymentDto)
    }

}
