import { ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class ConfirmPaymenyDto {

    @IsString()
    @IsNotEmpty()
    paymentKey: string;

    @IsString()
    @IsNotEmpty()
    orderNumber: string;

    @IsNumber()
    @IsNotEmpty()
    amount: number;

    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true })
    cartSeqList: number[];
}

export class CancelPaymentDto {
    
    @IsString()
    @IsNotEmpty()
    orderNumber: string;

    @IsString()
    @IsOptional()
    cancelReason?: string;
}