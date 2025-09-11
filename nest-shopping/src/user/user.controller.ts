import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/user.dto';

@Controller('user')
export class UserController {
    constructor(
        private userService: UserService
    ) { }

    @Post('signup')
    async signup (@Body() createUserDto: CreateUserDto) {
        return this.userService.signup(createUserDto);
    }

    
}
