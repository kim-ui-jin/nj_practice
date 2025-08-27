import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user.service';
import { UserDTO } from './dto/user.dto';
import { User } from './entity/user.entity';
import * as bcrypt from 'bcrypt';
import { Payload } from './security/payload.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService
    ) { }

    async registerUser(newUser: UserDTO): Promise<User> {
        const userFind = await this.userService.findByFields({
            where: { username: newUser.username }
        });
        if (userFind) {
            throw new HttpException('Username already used!', HttpStatus.BAD_REQUEST);
        }
        return this.userService.save(newUser);
    }

    async validateUser(userDto: UserDTO): Promise<{ accessToken: string }> {
        const userFind = await this.userService.findByFields({
            where: { username: userDto.username }
        });

        if (!userFind) {
            throw new UnauthorizedException();
        }

        const validatePassword = await bcrypt.compare(userDto.password, userFind.password);

        if (!validatePassword) {
            throw new UnauthorizedException();
        }

        const payload: Payload = { id: userFind.id, username: userFind.username }

        return { accessToken: this.jwtService.sign(payload) };
    }

}
