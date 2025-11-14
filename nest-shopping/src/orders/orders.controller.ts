import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { CreateOrderDto } from './dto/order.dto';
import { OrdersService } from './orders.service';
import { Order } from './entity/order.entity';
import { OrderPreview } from './type/order.type';

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

    @Get('preview')
    @UseGuards(JwtAuthGuard)
    async orderPreview(
        @Req() req: any
    ): Promise<OrderPreview> {
        const userSeq = req.user.seq;
        return this.ordersService.orderPreview(userSeq);
    }
}
