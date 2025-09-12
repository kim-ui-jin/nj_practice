import { Body, Controller, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ChangePasswordDto, CreateUserDto } from './dto/user.dto';
import type { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';

@Controller('user')
export class UserController {
    constructor(
        private userService: UserService
    ) { }

    @Post('signup')
    async signup(@Body() createUserDto: CreateUserDto) {
        const user = await this.userService.signup(createUserDto);
        return { message: '회원가입 성공', user };
    }

    @Patch('change-password')
    @UseGuards(JwtAuthGuard)
    async changeMyPassword(@Req() req: any, @Body() changePasswordDto: ChangePasswordDto) {
        await this.userService.changePassword(req.user.seq, changePasswordDto);
        return { message: '비밀번호 변경 성공' }
    }
}
