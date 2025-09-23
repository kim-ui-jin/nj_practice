import { BadRequestException, Get, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Repository } from 'typeorm';
import { ChangePasswordDto, CreateUserDto, DeleteAccountDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import { BaseResponseDto } from 'src/common/dto/base_response.dto';
type SafeUser = Omit<User, 'userPassword'>;
type GetMyInfo = Pick<User, 'userId' | 'userName' | 'userEmail' | 'userPhone'>

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

        const user = await this.userRepository.findOne({
            where: { seq },
            select: { seq: true, userPassword: true },
        });
        if (!user) throw new NotFoundException();

        const comparedPassword = await bcrypt.compare(changePasswordDto.currentPassword, user.userPassword);
        if (!comparedPassword) throw new BadRequestException('현재 비밀번호가 올바르지 않습니다.');
        if (changePasswordDto.currentPassword === changePasswordDto.newPassword) {
            throw new BadRequestException('현재 비밀번호와 동일한 비밀번호로 변경할 수 없습니다.');
        }

        user.userPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
        user.refreshTokenHash = null;

        await this.userRepository.save(user);

        return { success: true, message: '비밀번호 변경 성공' }

    }

    // 중복 아이디 조회
    async existsByUserId(userId: string): Promise<boolean> {
        return await this.userRepository.exists({ where: { userId } });
    }

    // 내 정보조회
    async getMyInfo(seq: number, currentPassword: string): Promise<GetMyInfo> {

        const user = await this.userRepository.findOne({
            where: { seq },
            select: { userId: true, userName: true, userEmail: true, userPhone: true, userPassword: true }
        });
        if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

        const comparedPassword = await bcrypt.compare(currentPassword, user.userPassword);
        if (!comparedPassword) throw new UnauthorizedException('비밀번호가 올바르지 않습니다.');

        const { userPassword, ...safe } = user

        return safe;
    }

    // 회원 탈퇴
    async deleteMe(seq: number, deleteAccountDto: DeleteAccountDto): Promise<BaseResponseDto> {

        const user = await this.userRepository.findOne({
            where: { seq },
            select: { seq: true, userPassword: true, refreshTokenHash: true }
        })
        if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

        const comparedPassword = await bcrypt.compare(deleteAccountDto.currentPassword, user.userPassword);
        if (!comparedPassword) throw new UnauthorizedException('비밀번호가 올바르지 않습니다.');

        await this.userRepository.update(seq, { refreshTokenHash: null });

        await this.userRepository.delete(seq);

        return { success: true, message: '회원탈퇴가 완료되었습니다.' };
    }

}
