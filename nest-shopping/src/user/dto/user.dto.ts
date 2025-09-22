import { IsEmail, IsNotEmpty, IsNumber, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateUserDto {

    @IsString()
    @MaxLength(10, { message: '아이디는 최대 10자까지 가능합니다.' })
    @Matches(/^[A-Za-z0-9_-]+$/, { message: '아이디는 영문/숫자/_-만 허용됩니다.' })
    @IsNotEmpty({ message: '아이디는 비어 있을 수 없습니다.' })
    userId: string;

    @IsString()
    @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s])\S{8,}$/, { message: '비밀번호는 공백 없이 8자 이상이며, 문자/숫자/특수문자를 각각 1자 이상 포함해야 합니다.' })
    @IsNotEmpty({ message: '비밀번호는 비어 있을 수 없습니다.' })
    userPassword: string;

    @IsString()
    @IsNotEmpty({ message: '이름은 비어 있을 수 없습니다.' })
    userName: string;

    @IsEmail({}, { message: '이메일 형식이 올바르지 않습니다.' })
    @IsNotEmpty({ message: '이메일은 비어 있을 수 없습니다.' })
    userEmail: string;

    @IsString()
    @IsNotEmpty({ message: '전화번호는 비어 있을 수 없습니다.' })
    userPhone: string;
}

export class LoginUserDto {

    @IsString()
    @IsNotEmpty({ message: '아이디는 비어 있을 수 없습니다.' })
    userId: string;

    @IsString()
    @IsNotEmpty({ message: '비밀번호는 비어 있을 수 없습니다.' })
    userPassword: string;
}

export class ChangePasswordDto {

    @IsString()
    @IsNotEmpty({ message: '현재 비밀번호는 비어 있을 수 없습니다.' })
    currentPassword: string;

    @IsString()
    @IsNotEmpty({ message: '새 비밀번호는 비어 있을 수 없습니다.' })
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s])\S{8,}$/, { message: '비밀번호는 공백 없이 8자 이상이며, 문자/숫자/특수문자를 각각 1자 이상 포함해야 합니다.' })
    newPassword: string;
}

export class CheckIdQueryDto {

    @IsString()
    @MaxLength(10, { message: '아이디는 최대 10자까지 가능합니다.' })
    @Matches(/^[A-Za-z0-9_-]+$/, { message: '아이디는 영문/숫자/_-만 허용됩니다.' })
    @IsNotEmpty({ message: '아이디는 비어 있을 수 없습니다.' })
    userId: string;
}

export class GetMyInfoDto {

    @IsString()
    @IsNotEmpty({ message: '비밀번호를 입력해주세요.' })
    userPassword: string;
}