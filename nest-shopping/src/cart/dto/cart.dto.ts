import { Type } from "class-transformer";
import { IsInt, IsPositive, Min } from "class-validator";

export class AddToCartDto {

    @Type(() => Number)
    @IsInt()
    @IsPositive()
    productSeq: number;

    @Type(() => Number)
    @IsInt()
    @Min(1, { message: '수량은 1개 이상이어야 합니다.'})
    quantity: number;
}