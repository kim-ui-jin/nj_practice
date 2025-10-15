import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RoleType } from "../../common/enums/role-type.enum";
import { InjectRepository } from "@nestjs/typeorm";
import { UserAuthority } from "src/user/entity/user-authority.entity";
import { In, Repository } from "typeorm";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        @InjectRepository(UserAuthority) private readonly userAuthorityRepository: Repository<UserAuthority>
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {

        const roles = this.reflector.get<RoleType[]>('roles', context.getHandler());
        if (!roles || roles.length === 0) return true;

        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) throw new ForbiddenException('권한이 없습니다.');

        const hasRequiredRole = await this.userAuthorityRepository.exists({
            where: {
                user: { seq: user.seq },
                authorityName: In(roles.map(requiredRole => String(requiredRole).toUpperCase())),
            },
        });

        if (!hasRequiredRole) throw new ForbiddenException('권한이 없습니다.');
        return true;
    }
}