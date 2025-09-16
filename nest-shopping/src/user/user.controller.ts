import { Body, Controller, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ChangePasswordDto, CreateUserDto } from './dto/user.dto';
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
}
