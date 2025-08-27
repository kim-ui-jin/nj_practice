import { SetMetadata } from "@nestjs/common";
import { RoleType } from "../role-type";

export const Roles = (...roles: RoleType[]): any => SetMetadata('roles', roles);
// Roles를 선언하는데 RoleType[] 타입으로 선언을 한다
// Metadata의 두번째 인자 roles에 RoleType[] 타입이 들어간다
// SetMetadata(키, 값)을 의미