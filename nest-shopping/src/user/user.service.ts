import { BadRequestException, ConflictException, HttpException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { QueryFailedError, Repository } from 'typeorm';
import { ChangePasswordDto, CreateUserDto, DeleteAccountDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import { UserAuthority } from './entity/user-authority.entity';
import { RoleType } from 'src/common/enums/role-type.enum';
import { CommonResponse } from 'src/common/common-response';
import { GetMyInfo, SafeUser } from './type/user-type';



@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        @InjectRepository(UserAuthority) private readonly userAuthorityRepository: Repository<UserAuthority>
    ) { }

    // 회원가입
    async signup(
        createUserDto: CreateUserDto
    ): Promise<CommonResponse<SafeUser>> {

        try {
            const { userPassword, userEmail, ...rest } = createUserDto;

            const existedUser = await this.userRepository.findOne({
                where: { userEmail }
            });
            if (existedUser) throw new BadRequestException('이미 존재하는 사용자입니다.');

            const hashedPassword = await bcrypt.hash(userPassword, 10);

            const user = this.userRepository.create({
                ...rest,
                userEmail,
                userPassword: hashedPassword,
                authorities: [{ authorityName: 'USER' }],
            });

            const saved = await this.userRepository.save(user);
            // 비밀번호 제거
            const { userPassword: _, ...safe } = saved;

            return {
                success: true,
                message: '회원가입 성공',
                data: safe
            };
        } catch (e) {
            if (e instanceof HttpException) throw e;
            throw new InternalServerErrorException('회원가입 처리 중 오류가 발생했습니다.');
        }

    }

    // 비밀번호 변경
    async changePassword(
        userSeq: number,
        changePasswordDto: ChangePasswordDto
    ): Promise<CommonResponse<void>> {

        const { currentPassword, newPassword } = changePasswordDto;

        try {

            const user = await this.userRepository.findOne({
                where: { seq: userSeq },
                select: {
                    seq: true,
                    userPassword: true
                }
            });
            if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

            const comparedPassword = await bcrypt.compare(currentPassword, user.userPassword);
            if (!comparedPassword) throw new BadRequestException('현재 비밀번호가 올바르지 않습니다.');
            if (currentPassword === newPassword) {
                throw new BadRequestException('현재 비밀번호와 동일한 비밀번호로 변경할 수 없습니다.');
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            const result = await this.userRepository.update(
                { seq: userSeq },
                {
                    userPassword: hashedPassword,
                    refreshTokenHash: null
                }
            );
            if (!result.affected) throw new InternalServerErrorException('비밀번호 변경에 실패했습니다.');

            return {
                success: true,
                message: '비밀번호 변경 성공'
            };
        } catch (e) {
            if (e instanceof HttpException) throw e;
            throw new InternalServerErrorException('비밀번호 변경 처리 중 오류가 발생했습니다.');
        }

    }

    // 중복 아이디 조회
    async checkId(
        userId: string
    ): Promise<CommonResponse<void>> {

        const exists = await this.userRepository.exists({ where: { userId } });

        return {
            success: true,
            message: exists ? '이미 사용중인 아이디입니다.' : '사용 가능한 아이디입니다.',
        };

    }

    // 내 정보조회
    async getMyInfo(
        userSeq: number,
        currentPassword: string
    ): Promise<CommonResponse<GetMyInfo>> {

        try {
            const user = await this.userRepository.findOne({
                where: { seq: userSeq },
                select: {
                    userId: true,
                    userName: true,
                    userEmail: true,
                    userPhone: true,
                    userPassword: true
                }
            });
            if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

            const comparedPassword = await bcrypt.compare(currentPassword, user.userPassword);
            if (!comparedPassword) throw new BadRequestException('비밀번호가 올바르지 않습니다.');

            const { userPassword, ...safe } = user;

            return {
                success: true,
                message: '내 정보 조회에 성공했습니다.',
                data: safe
            };
        } catch (e) {
            if (e instanceof HttpException) throw e;
            throw new InternalServerErrorException('내 정보 조회 중 오류가 발생했습니다.');
        }

    }

    // 회원 탈퇴
    async deleteAccount(
        userSeq: number,
        deleteAccountDto: DeleteAccountDto
    ): Promise<CommonResponse<void>> {

        const { currentPassword } = deleteAccountDto

        const user = await this.userRepository.findOne({
            where: { seq: userSeq },
            select: { seq: true, userPassword: true }
        });
        if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

        const comparedPassword = await bcrypt.compare(currentPassword, user.userPassword);
        if (!comparedPassword) throw new UnauthorizedException('비밀번호가 올바르지 않습니다.');

        try {

            const cancel = await this.userRepository.update(
                { seq: userSeq },
                { refreshTokenHash: null }
            );
            if (!cancel.affected) throw new InternalServerErrorException('토큰 무효화에 실패했습니다.');

            const deleteAccount = await this.userRepository.delete({ seq: userSeq });
            if (!deleteAccount.affected) throw new InternalServerErrorException('회원 삭제에 실패했습니다.');

            return {
                success: true,
                message: '회원탈퇴가 완료되었습니다.'
            };

        } catch (e) {
            if (e instanceof HttpException) throw e;

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
    async findAll(): Promise<CommonResponse<SafeUser[]>> {
        const users = await this.userRepository.find();

        return {
            success: true,
            message: users.length ? '유저 전체 조회 성공' : '유저가 없습니다.',
            data: users as SafeUser[],
        }

    }

    // 유저 조회
    async findByField(
        seq: number
    ): Promise<User | null> {
        const user = await this.userRepository.findOne({ where: { seq } })
        if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
        return user;
    }

    // SELLER 권한 등록
    async registerSeller(
        userSeq: number
    ): Promise<CommonResponse<void>> {

        try {

            const user = await this.userRepository.findOne({
                where: { seq: userSeq }
            });
            if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

            const exists = await this.userAuthorityRepository.exists({
                where: {
                    user: { seq: userSeq },
                    authorityName: RoleType.SELLER
                }
            });
            if (exists) throw new ConflictException('이미 셀러 권한이 부여되어 있습니다.');

            const userAuthority = this.userAuthorityRepository.create({
                authorityName: RoleType.SELLER,
                user: { seq: userSeq },
            });

            await this.userAuthorityRepository.save(userAuthority);
            return {
                success: true,
                message: '셀러 권한이 등록되었습니다.'
            };
        } catch (e) {
            if (e instanceof HttpException) throw e;
            throw new InternalServerErrorException('셀러 권한 등록 중 오류가 발생했습니다.');
        }

    }
}
