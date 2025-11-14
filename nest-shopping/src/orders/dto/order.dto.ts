import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateOrderDto {

    @IsString()
    @IsNotEmpty()
    receiverName: string;

    @IsString()
    @IsNotEmpty()
    receiverPhone: string;

    @IsString()
    @IsNotEmpty()
    zipCode: string;

    @IsString()
    @IsNotEmpty()
    address1: string;

    @IsString()
    @IsOptional()
    address2?: string;

    @IsString()
    @IsOptional()
    memo?: string;
}