import { HttpException, Injectable, InternalServerErrorException, UnauthorizedException, Logger, Inject } from '@nestjs/common';
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
import Redis from 'ioredis';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        @Inject('REDIS') private readonly redis: Redis
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

            return CommonResponse.ok(
                '로그인 성공',
                {
                    accessToken: accessToken,
                    refreshToken: refreshToken
                }
            );

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
                    await this.redis.del(this.getRefreshKey(seq));
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
        if (!user) throw new UnauthorizedException('사용자를 찾을 수 없습니다.');

        const redisHash = await this.redis.get(this.getRefreshKey(user.seq));

        if (redisHash) {
            const matched = await bcrypt.compare(refreshToken, redisHash);
            if (!matched) {
                await this.redis.del(this.getRefreshKey(user.seq));
                await this.userRepository.update(user.seq, { refreshTokenHash: null });
                throw new UnauthorizedException('유효하지 않은 리프레시 토큰');
            }

        } else {
            if (!user.refreshTokenHash) throw new UnauthorizedException('등록된 리프레시 토큰이 없습니다.');

            const matched = await bcrypt.compare(refreshToken, user.refreshTokenHash);
            if (!matched) {
                await this.userRepository.update(user.seq, { refreshTokenHash: null })
                throw new UnauthorizedException('유효하지 않은 리프레시 토큰');
            }

            const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;
            await this.redis.set(this.getRefreshKey(user.seq), user.refreshTokenHash, 'EX', REFRESH_TTL_SECONDS);
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

    private getRefreshKey(userSeq: number) {
        return `auth:refresh:${userSeq}`;
    }

    // 리프레시 토큰을 DB에 저장
    async saveRefreshToken(
        seq: number,
        refreshToken: string
    ): Promise<void> {

        try {
            const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
            const key = this.getRefreshKey(seq);
            const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;
            await this.redis.set(key, refreshTokenHash, 'EX', REFRESH_TTL_SECONDS);
            await this.userRepository.update(seq, { refreshTokenHash });
        } catch (e) {
            throw new InternalServerErrorException('리프레시 토큰 저장 중 오류가 발생했습니다.')
        }

    }

    // 토큰 검증
    async tokenValidateUser(
        payload: JwtPayload
    ) {
        if (!payload?.seq) return null;

        const user = await this.userService.findForAuth(payload.seq);
        if (!user) return null;
        if (user.status === 'INACTIVE') return null;

        const roles = (user.authorities ?? []).map(a => String(a.authorityName).toUpperCase());

        return {
            seq: user.seq,
            userId: user.userId,
            userName: user.userName,
            roles
        };
    }

    // 로그아웃
    async logout(
        userSeq: number
    ): Promise<CommonResponse<void>> {

        await this.redis.del(this.getRefreshKey(userSeq));

        const logout = await this.userRepository.update(
            { seq: userSeq },
            { refreshTokenHash: null }
        );
        if (!logout) throw new InternalServerErrorException('로그아웃에 실패했습니다.');
        return CommonResponse.ok('로그아웃에 성공했습니다.');

    }
}
