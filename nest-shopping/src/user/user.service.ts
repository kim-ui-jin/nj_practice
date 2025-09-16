import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Repository } from 'typeorm';
import { ChangePasswordDto, CreateUserDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import { BaseResponseDto } from 'src/common/dto/base_response.dto';
type SafeUser = Omit<User, 'userPassword'>;

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>
    ) { }

    // 회원가입
    async signup(createUserDto: CreateUserDto): Promise<BaseResponseDto<SafeUser>> {

        const existedUser = await this.userRepository.findOne({ where: { userId: createUserDto.userId } });
        const existedEmail = await this.userRepository.findOne({ where: { userEmail: createUserDto.userEmail } });
        const existedPhone = await this.userRepository.findOne({ where: { userPhone: createUserDto.userPhone } });
        
        if (existedUser) throw new BadRequestException('이미 존재하는 아이디입니다.');
        if (existedEmail) throw new BadRequestException('이미 존재하는 이메일입니다.');
        if (existedPhone) throw new BadRequestException('이미 존재하는 전화번호입니다.');

        const hashedPassword = await bcrypt.hash(createUserDto.userPassword, 10);

        const user = this.userRepository.create({ ...createUserDto, userPassword: hashedPassword });

        const saved = await this.userRepository.save(user);

        const { userPassword, ...safe } = saved as User; // 비밀번호 제거

        return { success: true, message: '회원가입 성공', data: safe as SafeUser };

    }

    // 유저 조회
    async findByField(seq: number): Promise<User | null> {
        const user = await this.userRepository.findOne({ where: { seq } })
        if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
        return user;
    }

    // 비밀번호 변경
    async changePassword(seq: number, changePasswordDto: ChangePasswordDto): Promise<BaseResponseDto> {

        const user = await this.userRepository.findOne({ where: { seq } });
        if (!user) throw new NotFoundException();

        const comparedPassword = await bcrypt.compare(changePasswordDto.currentPassword, user.userPassword);
        if (!comparedPassword) throw new BadRequestException('현재 비밀번호가 올바르지 않습니다.');
        if (changePasswordDto.currentPassword === changePasswordDto.newPassword) {
            throw new BadRequestException('현재 비밀번호와 동일한 비밀번호로 변경할 수 없습니다.');
        }

        user.userPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

        await this.userRepository.save(user);

        return { success: true, message: '비밀번호 변경 성공' }

    }
}
