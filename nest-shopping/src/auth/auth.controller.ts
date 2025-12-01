import { Body, Controller, Post, Req, UseGuards, BadRequestException, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from 'src/user/dto/user.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { CommonResponse } from 'src/common/common-response';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) { }

    // 로그인
    @Post('login')
    async login(
        @Body() loginUserDto: LoginUserDto
    ): Promise<CommonResponse<{ accessToken: string, refreshToken: string }>> {
        return this.authService.login(loginUserDto);
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
    async logout(
        @Req() req: any
    ): Promise<CommonResponse<void>> {
        const userSeq = req.user.seq;
        return this.authService.logout(userSeq);
    }
}
