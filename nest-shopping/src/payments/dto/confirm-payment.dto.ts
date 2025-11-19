import { IsNumber, IsString } from "class-validator";

export class ConfirmPaymenyDto {

    @IsString()
    paymentKey: string;

    @IsString()
    orderNumber: string;

    @IsNumber()
    amount: number;
}