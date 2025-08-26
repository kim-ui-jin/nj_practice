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

    async validateUser(userDTO: UserDTO): Promise<User> {
        const userFind = await this.userService.findByFields({
            where: { username: userDTO.username }
        });
        if (!userFind || userDTO.password !== userFind.password) {
            throw new UnauthorizedException();
        }
        return userFind;
    }


}
