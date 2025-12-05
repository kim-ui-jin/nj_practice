import { Body, Controller, Delete, Get, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ChangePasswordDto, CheckIdDto, CreateUserDto, DeleteAccountDto, GetMyInfoDto } from './dto/user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { RoleType } from 'src/common/enums/role-type.enum';
import { CommonResponse } from 'src/common/common-response';
import { GetMyInfo, SafeUser } from './type/user-type';

@Controller('users')
export class UserController {
    constructor(
        private readonly userService: UserService
    ) { }

    @Post('signup')
    async signup(
        @Body() createUserDto: CreateUserDto
    ): Promise<CommonResponse<SafeUser>> {
        return this.userService.signup(createUserDto);
    }

    @Patch('change-password')
    @UseGuards(JwtAuthGuard)
    async changePassword(
        @Req() req: any, 
        @Body() changePasswordDto: ChangePasswordDto
    ): Promise<CommonResponse<void>> {
        const userSeq = req.user.seq
        return this.userService.changePassword(userSeq, changePasswordDto);
    }

    @Get('check-id')
    async checkId(
        @Query() checkIdDto: CheckIdDto
    ): Promise<CommonResponse<void>> {
        const userId = checkIdDto.userId
        return this.userService.checkId(userId);
    }

    @Post('me')
    @UseGuards(JwtAuthGuard)
    async getMyInfo(
        @Req() req: any, 
        @Body() getMyInfoDto: GetMyInfoDto
    ): Promise<CommonResponse<GetMyInfo>> {
        const userSeq = req.user.seq;
        return this.userService.getMyInfo(userSeq, getMyInfoDto.currentPassword);
    }

    @Delete('delete-account')
    @UseGuards(JwtAuthGuard)
    async deleteAccount(
        @Req() req: any, 
        @Body() deleteAccountDto: DeleteAccountDto
    ): Promise<CommonResponse<void>> {
        const user = req.user;
        return this.userService.deleteAccount(user.seq, deleteAccountDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleType.ADMIN)
    findAll() {
        return this.userService.findAll();
    }

    @Post('me/roles/seller')
    @UseGuards(JwtAuthGuard)
    async registerSeller(
        @Req() req: any
    ): Promise<CommonResponse<void>> {
        const userSeq = req.user.seq;
        return this.userService.registerSeller(userSeq);
    }

    // 주소 변경
    @Post('address')
    @UseGuards(JwtAuthGuard)
    async changeAddress(
        @Req() req: any,
        @Body('userAddress') userAddress: string
    ): Promise<CommonResponse<void>> {
        const userSeq = req.user.seq;
        return this.userService.changeAddress(userSeq, userAddress);
    }

}
