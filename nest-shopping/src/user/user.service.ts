import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto, LoginUserDto } from './dto/user.dto';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>
    ) { }

    // 회원가입
    signup(createUserDto: CreateUserDto): Promise<User> {
        const user = this.userRepository.create(createUserDto);
        return this.userRepository.save(user);
    }

    // 로그인
    async login(loginUserDto: LoginUserDto): Promise<User | null> {
        const user = await this.userRepository.findOne({
            where: { userId: loginUserDto.userId, userPassword: loginUserDto.userPassword}
        });

        if(!user) {
            throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다');
        }

        return user;
    }

    
}
