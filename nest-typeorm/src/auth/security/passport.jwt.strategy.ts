import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "../auth.service";
import { Payload } from "./payload.interface";
import { User } from "src/domain/entity/user.entity";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: true,
            secretOrKey: 'SECRET_KEY'
        })
    }

    async validate(payload: Payload): Promise<User> {
        const user = await this.authService.tokenValidateUser(payload);
        if (!user) {
            throw new UnauthorizedException({ message: 'user does not exist' })
        }
        return user;
    }
}