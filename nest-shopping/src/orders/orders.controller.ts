import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { CreateOrderDto } from './dto/order.dto';
import { OrdersService } from './orders.service';
import { Order } from './entity/order.entity';
import { ConfirmOrder, GetCompleteOrder } from './type/order.type';
import { CancelPaymentDto, ConfirmPaymenyDto } from 'src/payments/dto/payment.dto';

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    async createOrder(
        @Req() req: any,
        @Body() createOrderDto: CreateOrderDto,
    ): Promise<Order> {
        const userSeq = req.user.seq;
        return this.ordersService.createOrder(userSeq, createOrderDto);
    }

    @Post('confirm')
    @UseGuards(JwtAuthGuard)
    async confirmPayment(
        @Req() req: any,
        @Body() confirmPaymentDto: ConfirmPaymenyDto,
    ): Promise<ConfirmOrder> {
        const userSeq = req.user.seq;
        return this.ordersService.confirmOrder(userSeq, confirmPaymentDto);
    }

    @Get(':orderNumber')
    @UseGuards(JwtAuthGuard)
    async getCompleteOrder(
        @Req() req: any,
        @Param('orderNumber') orderNumber: string,
    ): Promise<GetCompleteOrder> {
        const userSeq = req.user.seq;
        return this.ordersService.getCompleteOrder(userSeq, orderNumber);
    }

    @Post('cancel')
    @UseGuards(JwtAuthGuard)
    async cancelOrder(
        @Req() req: any,
        @Body() cancelPaymentDto: CancelPaymentDto,
    ) {
        const userSeq = req.user.seq;
        return this.ordersService.cancelOrder(userSeq, cancelPaymentDto)
    }

}
