import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user.service';
import { UserDTO } from './dto/user.dto';
import { User } from '../domain/entity/user.entity';
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

        this.convertInAuthorities(userFind);

        const payload: Payload = {
            id: userFind.id,
            username: userFind.username,
            authorities: userFind.authorities
        }

        return { accessToken: this.jwtService.sign(payload) };
    }

    // authorities의 전체 값이 아니라 권한만 들어가야 하기 때문에 수정이 필요
    async tokenValidateUser(payload: Payload): Promise<User | null> {
        const userFind = await this.userService.findByFields({
            where: { id: payload.id }
        })
        this.flatAuthorities(userFind);
        return userFind;
    }

    private flatAuthorities(user: any): User {
        if (user && user.authorities) {
            const authorities: string[] = [];
            user.authorities.forEach(authority => authorities.push(authority.authorityName));
            user.authorities = authorities;
        }
        return user;
    }

    private convertInAuthorities(user: any): User {
        if (user && user.authorities) {
            const authorities: any[] = [];
            user.authorities.forEach(authority => {
                authorities.push({ name: authority.authorityName });
            })
            user.authorities = authorities;
        };
        return user;
    }
}
