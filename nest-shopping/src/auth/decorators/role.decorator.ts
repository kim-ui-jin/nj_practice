import { SetMetadata } from "@nestjs/common";
import { RoleType } from "../enums/role-type.enum";

export const Roles = (...roles: RoleType[]): any => SetMetadata('roles', roles);