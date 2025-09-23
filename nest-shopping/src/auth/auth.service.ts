import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginUserDto } from 'src/user/dto/user.dto';
import { User } from 'src/user/entity/user.entity';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { JwtPayload } from './jwt/payload.interface';
import * as bcrypt from 'bcrypt';
import { BaseResponseDto } from 'src/common/dto/base_response.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
    ) { }

    // 로그인
    async login(loginUserDto: LoginUserDto): Promise<{ accessToken: string, refreshToken: string }> {

        const user = await this.userRepository.findOne({
            where: { userId: loginUserDto.userId },
            select: { seq: true, userId: true, userName: true, userPassword: true }
        });
        if (!user) {
            throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');
        }

        const comparedPassword = await bcrypt.compare(loginUserDto.userPassword, user.userPassword);
        if (!comparedPassword) {
            throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');
        }

        const accessPayload = { seq: user.seq, userId: user.userId, userName: user.userName };
        const refreshPayload = { seq: user.seq };

        const accessToken = this.jwtService.sign(accessPayload, {
            secret: process.env.JWT_ACCESS_SECRET,
            expiresIn: '15m'
        });
        const refreshToken = this.jwtService.sign(refreshPayload, {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: '7d'
        });

        await this.saveRefreshToken(user.seq, refreshToken);

        return {
            accessToken: accessToken,
            refreshToken: refreshToken
        }

    }

    async refreshByToken(refreshToken: string): Promise<{ accessToken: string, refreshToken: string }> {

        let decoded: any;

        try {
            decoded = this.jwtService.verify(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET
            });
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                const tokenExpired = this.jwtService.verify(refreshToken, {
                    secret: process.env.JWT_REFRESH_SECRET,
                    ignoreExpiration: true
                });
                const seq = tokenExpired.seq;
                if (seq) {
                    await this.userRepository.update(seq, { refreshTokenHash: null });
                }
                throw new UnauthorizedException('리프레시 토큰 만료')
            }
            throw new UnauthorizedException('리프레시 토큰 검증 실패');
        }

        const userSeq = decoded.seq;
        if (!userSeq) throw new UnauthorizedException('리프레시 토큰에 사용자 식별자가 없습니다')

        const user = await this.userRepository.findOne({
            where: { seq: userSeq },
            select: { seq: true, userId: true, userName: true, refreshTokenHash: true }
        });
        if (!user?.refreshTokenHash) throw new UnauthorizedException('등록된 리프레시 토큰이 없습니다.');

        const matched = await bcrypt.compare(refreshToken, user.refreshTokenHash)
        if (!matched) {
            await this.userRepository.update(user.seq, { refreshTokenHash: null })
            throw new UnauthorizedException('유효하지 않은 리프레시 토큰');
        }

        const newAccessPayload = { seq: user.seq, userId: user.userId, userName: user.userName }
        const newRefreshPayload = { seq: user.seq };

        const newAccessToken = this.jwtService.sign(newAccessPayload, {
            secret: process.env.JWT_ACCESS_SECRET,
            expiresIn: '15m'
        })
        const newRefreshToken = this.jwtService.sign(newRefreshPayload, {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: '7d'
        })

        await this.saveRefreshToken(user.seq, newRefreshToken);

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        }

    }

    // 리프레시 토큰을 DB에 저장
    async saveRefreshToken(seq: number, refreshToken: string): Promise<void> {

        try {
            const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
            await this.userRepository.update(seq, { refreshTokenHash });
        } catch (err) {
            throw new InternalServerErrorException('리프레시 토큰 저장 중 오류가 발생했습니다.')
        }

    }

    // 토큰 검증
    tokenValidateUser(payload: JwtPayload): Promise<User | null> {
        return this.userService.findByField(payload.seq);
    }

    // 로그아웃
    async logout(seq: number): Promise<BaseResponseDto> {

        try {
            await this.userRepository.update(seq, { refreshTokenHash: null });
            return { success: true, message: '로그아웃 성공' };
        } catch (err) {
            return { success: false, message: '로그아웃 처리 중 오류가 발생했습니다.' };
        }

    }
}
