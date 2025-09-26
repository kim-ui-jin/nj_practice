import { BadRequestException, ConflictException, Get, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { QueryFailedError, Repository } from 'typeorm';
import { ChangePasswordDto, CreateUserDto, DeleteAccountDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import { BaseResponseDto } from 'src/common/dto/base_response.dto';
import { UserAuthority } from './entity/user-authority.entity';
type SafeUser = Omit<User, 'userPassword'>;
type GetMyInfo = Pick<User, 'userId' | 'userName' | 'userEmail' | 'userPhone'>

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(UserAuthority) private userAuthorityRepository: Repository<UserAuthority>
    ) { }

    // 회원가입
    async signup(createUserDto: CreateUserDto): Promise<BaseResponseDto<SafeUser>> {

        const existedUser = await this.userRepository.findOne({
            where: {
                userEmail: createUserDto.userEmail
            }
        });
        if (existedUser) throw new BadRequestException('이미 존재하는 사용자입니다.');

        // const existedEmail = await this.userRepository.findOne({ where: { userEmail: createUserDto.userEmail } });
        // if (existedEmail) throw new BadRequestException('이미 존재하는 이메일입니다.');

        const hashedPassword = await bcrypt.hash(createUserDto.userPassword, 10);

        const user = this.userRepository.create({
            ...createUserDto,
            userPassword: hashedPassword,
            authorities: [
                this.userRepository.manager.create(UserAuthority, { authorityName: 'USER' }),
            ],
        });

        try {

            const saved = await this.userRepository.save(user);

            // 비밀번호 제거
            const { userPassword, ...safe } = saved as User;

            return { success: true, message: '회원가입 성공', data: safe as SafeUser };

        } catch (e) {
            throw new InternalServerErrorException('회원가입 처리 중 오류가 발생했습니다.');
        }

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

        const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

        try {

            const result = await this.userRepository.update(
                { seq },
                { userPassword: hashedPassword, refreshTokenHash: null },
            );
            if (!result.affected) throw new InternalServerErrorException('비밀번호 변경에 실패했습니다.');

            return { success: true, message: '비밀번호 변경 성공' };

        } catch (e) {

            if (e instanceof QueryFailedError) {
                throw new InternalServerErrorException('비밀번호 변경 중 데이터베이스 오류가 발생했습니다.');
            }
            throw new InternalServerErrorException('비밀번호 변경 처리 중 오류가 발생했습니다.');

        }

    }

    // 중복 아이디 조회
    async existsByUserId(userId: string): Promise<BaseResponseDto<{ available: boolean }>> {

        const exists = await this.userRepository.exists({ where: { userId } });

        return {
            success: true,
            message: exists ? '이미 사용중인 아이디입니다.' : '사용 가능한 아이디입니다.',
            data: { available: !exists },
        };

    }

    // 내 정보조회
    async getMyInfo(seq: number, currentPassword: string): Promise<GetMyInfo> {

        const user = await this.userRepository.findOne({
            where: { seq },
            select: { userId: true, userName: true, userEmail: true, userPhone: true, userPassword: true }
        });
        if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

        const comparedPassword = await bcrypt.compare(currentPassword, user.userPassword);
        if (!comparedPassword) throw new BadRequestException('비밀번호가 올바르지 않습니다.');

        const { userPassword, ...safe } = user;

        return safe;
    }

    // 회원 탈퇴
    async deleteMe(seq: number, deleteAccountDto: DeleteAccountDto): Promise<BaseResponseDto> {

        const user = await this.userRepository.findOne({
            where: { seq },
            select: { seq: true, userPassword: true }
        });
        if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

        const comparedPassword = await bcrypt.compare(deleteAccountDto.currentPassword, user.userPassword);
        if (!comparedPassword) throw new UnauthorizedException('비밀번호가 올바르지 않습니다.');

        try {

            const cancel = await this.userRepository.update(seq, { refreshTokenHash: null });
            if (!cancel.affected) throw new InternalServerErrorException('토큰 무효화에 실패했습니다.');

            const deleteAccount = await this.userRepository.delete(seq);
            if (!deleteAccount.affected) throw new InternalServerErrorException('회원 삭제에 실패했습니다.');

            return { success: true, message: '회원탈퇴가 완료되었습니다.' };

        } catch (e) {

            // 지금 잡힌 오류 e가 TypeORM이 던지는 SQL 실행 실패용 에러(= QueryFailedError)냐?를 체크한다는 뜻
            if (e instanceof QueryFailedError) {

                const code = e.driverError.code;
                // 부모 행을 지우거나 바꾸려는데, 자식이 참조 중이라 실패할 경우
                if (code === 'ER_ROW_IS_REFERENCED_2' || code === 'ER_ROW_IS_REFERENCED') {
                    throw new ConflictException('연관된 데이터 때문에 삭제할 수 없습니다.');
                }
                throw new InternalServerErrorException('회원탈퇴 처리 중 데이터베이스 오류가 발생했습니다.');
            }
            throw new InternalServerErrorException('회원탈퇴 처리 중 오류가 발생했습니다.');

        }

    }

    // 유저 전체 조회
    async findAll(): Promise<BaseResponseDto<SafeUser[]>> {

        try {

            const users = await this.userRepository.find();
            return {
                success: true,
                message: users.length ? '유저 전체 조회 성공' : '유저가 없습니다.',
                data: users as SafeUser[],
            }

        } catch (e) {

            if (e instanceof QueryFailedError) {
                throw new InternalServerErrorException('유저 목록 조회 중 데이터 베이스 오류가 발생했습니다.')
            }
            throw new InternalServerErrorException('유저 목록 조회 중 오류가 발생했습니다.')

        }

    }
}
