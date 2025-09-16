import { Injectable, UnauthorizedException } from '@nestjs/common';
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
            where: { userId: loginUserDto.userId }
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
            secret: 'mySecretkey',
            expiresIn: '30s'
        });
        const refreshToken = this.jwtService.sign(refreshPayload, {
            secret: 'myRefreshKey',
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
                secret: 'myRefreshKey'
            });
        } catch (err) {
            if (err.name === 'TokenExpiredError') throw new UnauthorizedException('리프레시 토큰 만료')
            throw new UnauthorizedException('리프레시 토큰 검증 실패');
        }

        const userSeq = decoded.seq;
        if (!userSeq) throw new UnauthorizedException('리프레시 토큰에 사용자 식별자가 없습니다')

        const user = await this.userRepository.findOne({ where: { seq: userSeq } });
        if (!user?.refreshTokenHash) throw new UnauthorizedException('등록된 리프레시 토큰이 없습니다.');

        const matched = await bcrypt.compare(refreshToken, user.refreshTokenHash)
        if (!matched) {
            await this.userRepository.update(user.seq, { refreshTokenHash: null })
            throw new UnauthorizedException('유효하지 않은 리프레시 토큰');
        }

        const newAccessPayload = { seq: user.seq, userId: user.userId, userName: user.userName }
        const newRefreshPayload = { seq: user.seq };

        const newAccessToken = this.jwtService.sign(newAccessPayload, {
            secret: 'mySecretkey',
            expiresIn: '30s'
        })
        const newRefreshToken = this.jwtService.sign(newRefreshPayload, {
            secret: 'myRefreshKey',
            expiresIn: '7d'
        })

        await this.saveRefreshToken(user.seq, newRefreshToken);

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        }

    }

    // 리프레시 토큰을 DB에 저장
    async saveRefreshToken(seq: number, refreshToken: string) {
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
        await this.userRepository.update(seq, { refreshTokenHash });
    }

    // 토큰 검증
    tokenValidateUser(payload: JwtPayload): Promise<User | null> {
        return this.userService.findByField(payload.seq);
    }

    // 로그아웃
    async logout(seq: number): Promise<BaseResponseDto> {
        await this.userRepository.update(seq, { refreshTokenHash: null });
        return { success: true, message: '로그아웃 성공'}
    }
}
