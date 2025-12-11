import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entity/product.entity';
import { UserAuthority } from 'src/user/entity/user-authority.entity';
import { User } from 'src/user/entity/user.entity';
import { Tag } from 'src/tags/entity/tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, UserAuthority, User, Tag])],
  controllers: [ProductsController],
  providers: [ProductsService]
})
export class ProductsModule {}
