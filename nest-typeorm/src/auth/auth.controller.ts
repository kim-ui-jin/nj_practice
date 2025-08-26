import { Body, Controller, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserDTO } from './dto/user.dto';
import { User } from './entity/user.entity';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    // 회원가입
    @Post('register')
    registerAccount(@Body() userDto: UserDTO): Promise<User> {
        return this.authService.registerUser(userDto);
    }

    // 로그인
    @Post('login')
    login(@Body() userDto: UserDTO): Promise<User> {
        return this.authService.validateUser(userDto);
    }
}
