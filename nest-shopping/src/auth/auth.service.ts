import { HttpException, Injectable, InternalServerErrorException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginUserDto } from 'src/user/dto/user.dto';
import { User } from 'src/user/entity/user.entity';
import { UserService } from 'src/user/user.service';
import { QueryFailedError, Repository } from 'typeorm';
import { JwtPayload } from './jwt/payload.interface';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { CommonResponse } from 'src/common/common-response';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    private readonly logger = new Logger(AuthService.name);

    // 로그인
    async login(
        loginUserDto: LoginUserDto
    ): Promise<CommonResponse<{ accessToken: string, refreshToken: string }>> {

        const { userId, userPassword } = loginUserDto;

        this.logger.log('Login attempt', { userId });

        try {

            const user = await this.userRepository.findOne({
                where: { userId },
                select: {
                    seq: true,
                    userId: true,
                    userName: true,
                    userPassword: true,
                    status: true
                }
            });
            if (!user) {
                throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');
            }
            if (user.status === 'INACTIVE') {
                throw new UnauthorizedException('비활성화된 계정입니다. 관리자에게 문의해주세요.');
            }

            const comparedPassword = await bcrypt.compare(userPassword, user.userPassword);
            if (!comparedPassword) {
                throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');
            }

            const accessPayload = {
                seq: user.seq,
                userId: user.userId,
                userName: user.userName
            };
            const refreshPayload = { seq: user.seq };

            const accessToken = this.jwtService.sign(accessPayload, {
                secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
                expiresIn: '15m'
            });
            const refreshToken = this.jwtService.sign(refreshPayload, {
                secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
                expiresIn: '7d'
            });

            await this.saveRefreshToken(user.seq, refreshToken);

            return {
                success: true,
                message: '로그인 성공',
                data: {
                    accessToken: accessToken,
                    refreshToken: refreshToken
                }
            };

        } catch (e) {
            if (e instanceof HttpException) throw e;
            if (e instanceof QueryFailedError) {
                throw new InternalServerErrorException('로그인 처리 중 데이터베이스 오류가 발생했습니다.');
            }
            throw new InternalServerErrorException('로그인 처리 중 오류가 발생했습니다.')
        }

    }

    async refreshByToken(
        refreshToken: string
    ): Promise<{ accessToken: string, refreshToken: string }> {

        const refreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
        const accessSecret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');

        let decoded: any;

        try {
            decoded = this.jwtService.verify(refreshToken, {
                secret: refreshSecret
            });
        } catch (e) {
            if (e.name === 'TokenExpiredError') {
                const tokenExpired = this.jwtService.verify(refreshToken, {
                    secret: refreshSecret,
                    ignoreExpiration: true
                });
                const seq = tokenExpired.seq;
                if (seq) {
                    await this.userRepository.update(seq, { refreshTokenHash: null });
                }
                throw new UnauthorizedException('리프레시 토큰 만료');
            }
            throw new UnauthorizedException('리프레시 토큰 검증 실패');
        }

        const userSeq = decoded.seq;
        if (!userSeq) throw new UnauthorizedException('리프레시 토큰에 사용자 식별자가 없습니다');

        const user = await this.userRepository.findOne({
            where: { seq: userSeq },
            select: {
                seq: true,
                userId: true,
                userName: true,
                refreshTokenHash: true
            }
        });
        if (!user?.refreshTokenHash) throw new UnauthorizedException('등록된 리프레시 토큰이 없습니다.');

        const matched = await bcrypt.compare(refreshToken, user.refreshTokenHash);
        if (!matched) {
            await this.userRepository.update(user.seq, { refreshTokenHash: null })
            throw new UnauthorizedException('유효하지 않은 리프레시 토큰');
        }

        const newAccessPayload = {
            seq: user.seq,
            userId: user.userId,
            userName: user.userName
        };
        const newRefreshPayload = { seq: user.seq };

        const newAccessToken = this.jwtService.sign(newAccessPayload, {
            secret: accessSecret,
            expiresIn: '15m'
        })
        const newRefreshToken = this.jwtService.sign(newRefreshPayload, {
            secret: refreshSecret,
            expiresIn: '7d'
        })

        await this.saveRefreshToken(user.seq, newRefreshToken);

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        }

    }

    // 리프레시 토큰을 DB에 저장
    async saveRefreshToken(
        seq: number,
        refreshToken: string
    ): Promise<void> {

        try {
            const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
            await this.userRepository.update(seq, { refreshTokenHash });
        } catch (e) {
            throw new InternalServerErrorException('리프레시 토큰 저장 중 오류가 발생했습니다.')
        }

    }

    // 토큰 검증
    tokenValidateUser(payload: JwtPayload): Promise<User | null> {
        return this.userService.findByField(payload.seq);
    }

    // 로그아웃
    async logout(
        userSeq: number
    ): Promise<CommonResponse<void>> {

        const logout = await this.userRepository.update(
            { seq: userSeq },
            { refreshTokenHash: null }
        );
        if (!logout) throw new InternalServerErrorException('로그아웃에 실패했습니다.');
        return {
            success: true,
            message: '로그아웃 성공'
        };

    }
}
