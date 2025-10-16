import { Type } from "class-transformer";
import { IsInt, IsPositive, Min } from "class-validator";

export class AddToCartDto {

    @Type(() => Number)
    @IsInt()
    @IsPositive()
    productSeq: number;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    quantity: number;
}