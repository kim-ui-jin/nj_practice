import { Body, Controller, Post, Res, Req, UseGuards, BadRequestException, Delete } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginUserDto } from 'src/user/dto/user.dto';
import { UserService } from 'src/user/user.service';
import { JwtAuthGuard } from './jwt/jwt.guard';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private userService: UserService,
    ) { }

    // 로그인
    @Post('login')
    async login(@Body() loginUserDto: LoginUserDto, @Res({ passthrough: true }) res: Response) {
        const result = await this.authService.login(loginUserDto);
        res.setHeader('Authorization', 'Bearer ' + result.accessToken);
        return result;
    }

    // 토큰 재발급
    @Post('refresh')
    async refresh(@Body('refreshToken') refreshToken: string) {
        if (!refreshToken) throw new BadRequestException('리프레시 토큰이 없습니다.');
        return this.authService.refreshByToken(refreshToken);
    }

    // 로그아웃
    @Delete('logout')
    @UseGuards(JwtAuthGuard)
    async logout(@Req() req: any) {
        return this.authService.logout(req.user.seq);
    }
}
