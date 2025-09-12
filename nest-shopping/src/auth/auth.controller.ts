import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginUserDto } from 'src/user/dto/user.dto';
import { UserService } from 'src/user/user.service';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private userService: UserService,
    ) { }

    // 로그인
    @Post('login')
    async login(@Body() loginUserDto: LoginUserDto, @Res({ passthrough: true }) res: Response) {

        const jwt = await this.authService.login(loginUserDto);
        res.setHeader('Authorization', 'Bearer ' + jwt.accessToken);

        return ({ message: '로그인 성공', jwt });
    }
}
