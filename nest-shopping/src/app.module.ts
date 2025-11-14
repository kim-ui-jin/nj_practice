import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { typeOrmConfig } from './config/typeorm.config';
import { envValidationSchema } from './config/validation.schema';
import { ProductsModule } from './products/products.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CartModule } from './cart/cart.module';
import { OrdersService } from './orders/orders.service';
import { OrdersController } from './orders/orders.controller';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/static'
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      validationSchema: envValidationSchema
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: typeOrmConfig,
    }),
    UserModule,
    AuthModule,
    ProductsModule,
    CartModule,
    OrdersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
