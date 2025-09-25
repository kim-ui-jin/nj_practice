import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { AuthService } from "../auth.service";
import { ExtractJwt, Strategy} from 'passport-jwt';
import { JwtPayload } from "./payload.interface";
import { User } from "src/user/entity/user.entity";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: 'mySecretkey',
        });
    }

    async validate(payload: JwtPayload) {

        const user = await this.authService.tokenValidateUser(payload);
        if (!user) throw new UnauthorizedException();

        const roles = (user.authorities ?? []).map(a => String(a.authorityName).toUpperCase());

        return { ...user, roles };
    }
}