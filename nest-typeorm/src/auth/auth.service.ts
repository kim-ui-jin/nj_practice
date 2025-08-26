import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user.service';
import { UserDTO } from './dto/user.dto';
import { User } from './entity/user.entity';

@Injectable()
export class AuthService {
    constructor(private userService: UserService) { }

    async registerUser(newUser: UserDTO): Promise<User> {
        const userFind = await this.userService.findByFields({
            where: { username: newUser.username }
        });
        if (userFind) {
            throw new HttpException('Username already used!', HttpStatus.BAD_REQUEST);
        }
        return this.userService.save(newUser);
    }

    async validateUser(userDto: UserDTO): Promise<User> {
        const userFind = await this.userService.findByFields({
            where: { username: userDto.username }
        });
        if (!userFind || userDto.password !== userFind.password) {
            throw new UnauthorizedException();
        }
        return userFind;
    }


}
