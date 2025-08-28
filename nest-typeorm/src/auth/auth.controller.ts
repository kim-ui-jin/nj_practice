import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserDTO } from './dto/user.dto';
import { User } from './entity/user.entity';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    // 회원가입
    @Post('register')
    registerAccount(@Body() userDto: UserDTO): Promise<User> {
        return this.authService.registerUser(userDto);
    }

    // 로그인
    @Post('login')
    async login(@Body() userDto: UserDTO, @Res() res: Response): Promise<any> {
        const jwt = await this.authService.validateUser(userDto);
        res.setHeader('Authorization', 'Bearer ' + jwt.accessToken);
        return res.json(jwt)
    }

    @Get('authenticate')
    @UseGuards(AuthGuard('jwt'))
    isAuthenticated(@Req() req: Request): any {
        const user: any = req.user;
        return user;
    }

}
