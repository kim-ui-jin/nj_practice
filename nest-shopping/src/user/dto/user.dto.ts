export class CreateUserDto {
    userId: string;
    userPassword: string;
    userName: string;
    userEmail: string;
    userPhone: string;
}

export class LoginUserDto {
    userId: string;
    userPassword: string;
}

export class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}