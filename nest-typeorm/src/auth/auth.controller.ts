import { Body, Controller, Get, Post, Req, Res, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserDTO } from './dto/user.dto';
import { User } from '../domain/entity/user.entity';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from './security/roles.guard';
import { Roles } from './decorator/role.decorator';
import { RoleType } from './role-type';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    // 회원가입
    @Post('register')
    @UsePipes(ValidationPipe)
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

    @Get('admin-role')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(RoleType.ADMIN) // RoleType의 ADMIN일 경우에만 사용 가능하게
    adminRoleCheck(@Req() req: Request): any {
        const user: any = req.user;
        return user;
    }

}
