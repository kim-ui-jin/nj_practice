import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Repository } from 'typeorm';
import { ChangePasswordDto, CreateUserDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>
    ) { }

    // 회원가입
    async signup(createUserDto: CreateUserDto): Promise<User> {

        const existedUser = await this.userRepository.findOne({ where: { userId: createUserDto.userId } });

        if (existedUser) {
            throw new BadRequestException('이미 존재하는 아이디입니다.');
        }

        const hashedPassword = await bcrypt.hash(createUserDto.userPassword, 10);

        const user = this.userRepository.create({ ...createUserDto, userPassword: hashedPassword });

        return this.userRepository.save(user);
    }

    // 유저 조회
    async findByFiled(seq: number): Promise<User | null> {
        return this.userRepository.findOne({ where: { seq } })
    }

    // 비밀번호 변경
    async changePassword(seq: number, changePasswordDto: ChangePasswordDto): Promise<void> {

        const user = await this.userRepository.findOne({ where: { seq } });
        if (!user) {
            throw new UnauthorizedException();
        }

        const comparedPassword = await bcrypt.compare(changePasswordDto.currentPassword, user.userPassword);
        if(!comparedPassword) {
            throw new BadRequestException('현재 비밀번호가 올바르지 않습니다.');
        }
        if (changePasswordDto.currentPassword === changePasswordDto.newPassword) {
            throw new BadRequestException('현재 비밀번호와 동일한 비밀번호로 변경할 수 없습니다.');
        }

        user.userPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

        await this.userRepository.save(user);
    }
}
