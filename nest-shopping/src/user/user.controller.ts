import { BadRequestException, Body, Controller, Get, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ChangePasswordDto, CheckIdQueryDto, CreateUserDto, GetMyInfoDto } from './dto/user.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';

@Controller('users')
export class UserController {
    constructor(
        private userService: UserService
    ) { }

    @Post('signup')
    async signup(@Body() createUserDto: CreateUserDto) {
        return await this.userService.signup(createUserDto);
    }

    @Patch('change-password')
    @UseGuards(JwtAuthGuard)
    async changeMyPassword(@Req() req: any, @Body() changePasswordDto: ChangePasswordDto) {
        return await this.userService.changePassword(req.user.seq, changePasswordDto);
    }

    @Get('check-id')
    async checkUserId(@Query() checkIdQueryDto: CheckIdQueryDto) {
        const exists = await this.userService.existsByUserId(checkIdQueryDto.userId);
        return { 
            available: !exists,
            message: !exists ? '사용 가능합니다.' : '사용 불가능합니다.'
        }
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getMyInfo(@Req() req: any, @Body() getMyInfoDto: GetMyInfoDto) {
        const data = await this.userService.getMyInfo(req.user.seq, getMyInfoDto.userPassword);
        return data;
    }
}
