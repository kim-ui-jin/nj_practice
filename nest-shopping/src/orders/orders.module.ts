import { Module } from '@nestjs/common';
import { Order } from './entity/order.entity';
import { OrderItem } from './entity/order-item.entity';
import { User } from 'src/user/entity/user.entity';
import { Product } from 'src/products/entity/product.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Cart } from 'src/cart/entity/cart.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Order, OrderItem, User, Product, Cart])],
    providers: [OrdersService],
    controllers: [OrdersController],
    exports: [OrdersService],
})
export class OrdersModule { }
