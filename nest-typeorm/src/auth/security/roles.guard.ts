import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { User } from "../../domain/entity/user.entity";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const roles = this.reflector.get<string[]>('roles', context.getHandler()); // context의 핸들러를 읽어올 수 있음

        if (!roles) return true;

        const request = context.switchToHttp().getRequest();
        const user = request.user as User;

        return !!user?.authorities?.some(role => roles.includes(role));
    }
}
// CanActivate -> 사용 가능한지 여부를 묻는다
// Reflector -> 프로그램 실행 시 메타데이터를 가져올 수 있게하는 구현체