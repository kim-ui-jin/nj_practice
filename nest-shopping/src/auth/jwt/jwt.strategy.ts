import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { AuthService } from "../auth.service";
import { ExtractJwt, Strategy} from 'passport-jwt';
import { JwtPayload } from "./payload.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: true,
            secretOrKey: 'mySecretkey',
        });
    }

    async validate(payload: JwtPayload) {
        const user = await this.authService.tokenValidateUser(payload);
        return user;
    }
}