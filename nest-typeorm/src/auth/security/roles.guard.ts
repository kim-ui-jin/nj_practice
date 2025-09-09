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
// ExecutionContext는 HTTP, WebSocket, gRPC 같은 다양한 실행 환경을 하나로 추상화한 객체 / ExecutionContext는 공용 컨텍스트
// Guard 같은 구성요소를 HTTP/WS/RPC 어디서든 재사용하려고 nest가 공용으로 먼저 준다
// switchToHttp() -> "지금 실행되는 게 HTTP 요청이야"라고 컨텍스트를 HTTP 전용으로 전환
// getRequest() -> Express의 req 객체를 반환
// if (!roles) return true; 지금의 라우트에는 @Roles(RoleType.ADMIN)가 붙어 있으니 roles가 undefined가 아님
// 그래서 if (!roles) return true; 줄은 실행되지 않음. 가드는 라우트 단위 뿐만 아니라, 컨트롤러 전체, 심지어 앱 전역에도 붙일 수 있다.
// 하지만 전역 등록이나, 일부 라우트에서 @Roles() 빼먹을 수 있는 상황을 대비한다면 넣어두는게 안전