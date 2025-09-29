import { Body, Controller, Delete, Get, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ChangePasswordDto, CheckIdQueryDto, CreateUserDto, DeleteAccountDto, GetMyInfoDto } from './dto/user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { RoleType } from 'src/auth/enums/role-type.enum';

@Controller('users')
export class UserController {
    constructor(
        private userService: UserService
    ) { }

    @Post('signup')
    async signup(@Body() createUserDto: CreateUserDto) {
        return this.userService.signup(createUserDto);
    }

    @Patch('change-password')
    @UseGuards(JwtAuthGuard)
    async changeMyPassword(@Req() req: any, @Body() changePasswordDto: ChangePasswordDto) {
        return this.userService.changePassword(req.user.seq, changePasswordDto);
    }

    @Get('check-id')
    async checkUserId(@Query() checkIdQueryDto: CheckIdQueryDto) {
        return this.userService.existsByUserId(checkIdQueryDto.userId);
    }

    @Post('me')
    @UseGuards(JwtAuthGuard)
    async getMyInfo(@Req() req: any, @Body() getMyInfoDto: GetMyInfoDto) {
        return this.userService.getMyInfo(req.user.seq, getMyInfoDto.userPassword);
    }

    @Delete('withdraw')
    @UseGuards(JwtAuthGuard)
    async deleteMetadata(@Req() req: any, @Body() deleteAccountDto: DeleteAccountDto) {
        const user = req.user;
        return this.userService.deleteMe(user.seq, deleteAccountDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleType.ADMIN)
    findAll() {
        return this.userService.findAll();
    }

    @Post('me/roles/seller')
    @UseGuards(JwtAuthGuard)
    async registerSeller(@Req() req: any) {
        const user = req.user;
        return this.userService.registerSeller(user.seq);
    }

}
