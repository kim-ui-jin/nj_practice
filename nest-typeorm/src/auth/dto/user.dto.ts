import { IsNotEmpty, isNotEmpty } from "class-validator";

export class UserDTO {

    @IsNotEmpty()
    username: string;

    @IsNotEmpty()
    password: string;
}