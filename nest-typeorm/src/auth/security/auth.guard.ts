import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard as NestAuthGuard } from "@nestjs/passport"
import { Observable } from "rxjs";

@Injectable()
export class AuthGuard extends NestAuthGuard('jwt') {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        return super.canActivate(context);
    }

    handleRequest(err, user, info) {
        if (info?.name === 'TokenExpiredError') {
            throw new UnauthorizedException({message: '토큰 만료'});
        }
        if (err || !user) {
            throw err || new UnauthorizedException({message: '인증 실패'});
        }
        return user;
    }
}