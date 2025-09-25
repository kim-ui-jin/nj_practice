import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { UserService } from 'src/user/user.service';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt/jwt.strategy';
import { UserModule } from 'src/user/user.module';
import { UserAuthority } from 'src/user/entity/user-authority.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserAuthority]), // User 엔티티를 AuthModule에서 사용 가능하도록 설정
    JwtModule.register({ }),
    PassportModule,
    UserModule
  ],
  exports: [JwtModule], // 다른 모듈에서 JwtModule과 사용할 수 있도록 내보냄
  providers: [AuthService, UserService, JwtStrategy],
  controllers: [AuthController]
})
export class AuthModule { }
