import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    handleRequest(err, user, info) {
        if (info?.name === 'TokenExpiredError') {
            throw new UnauthorizedException('토큰이 만료되었습니다.');
        }
        if (err || !user) {
            throw err || new UnauthorizedException('인증에 실패했습니다.');
        }
        return user;
    }
}