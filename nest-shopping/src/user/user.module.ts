import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { UserAuthority } from './entity/user-authority.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserAuthority])],
  exports: [UserService],
  providers: [UserService],
  controllers: [UserController]
})
export class UserModule {}
