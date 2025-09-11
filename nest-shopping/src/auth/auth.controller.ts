import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from 'src/user/dto/user.dto';
import { UserService } from 'src/user/user.service';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private userService: UserService,
    ) { }

    @Post('login')
    login(@Body() loginUserDto: LoginUserDto) {
        return this.authService.login(loginUserDto);
    }
}
