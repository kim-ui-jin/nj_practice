import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/products/entity/product.entity';
import { UserAuthority } from 'src/user/entity/user-authority.entity';
import { User } from 'src/user/entity/user.entity';
import { Cart } from './entity/cart.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, UserAuthority, User, Cart])],
  providers: [CartService],
  controllers: [CartController]
})
export class CartModule {}
