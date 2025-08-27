import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "../auth.service";
import { Payload } from "./payload.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: true,
            secretOrKey: 'SECRET_KEY'
        })
    }

    async validate(payload: Payload): Promise<any> {
        const user = await this.authService.tokenValidateUser(payload);
        if(!user) {
            return new UnauthorizedException({message: 'user does not exist'})
        }
        return user;
    }
}