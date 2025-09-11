import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginUserDto } from 'src/user/dto/user.dto';
import { User } from 'src/user/entity/user.entity';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
    ) { }

    // 로그인
    async login(loginUserDto: LoginUserDto): Promise<{ accessToken: string }> {
        const user = await this.userRepository.findOne({
            where: { userId: loginUserDto.userId, userPassword: loginUserDto.userPassword}
        });

        if(!user) {
            throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다');
        }

        const payload = { seq: user.seq, userId: user.userId, userName: user.userName };

        return { accessToken: this.jwtService.sign(payload)}
    }

}
