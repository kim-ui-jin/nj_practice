import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsInt, IsPositive, Min } from "class-validator";

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

export class UpdateQuantityDto {

    @Type(() => Number)
    @IsInt()
    @IsPositive()
    productSeq: number;

    @Type(() => Number)
    @IsInt()
    @Min(1, { message: '수량은 1개 이상이어야 합니다.'})
    newQuantity: number;
}

export class RemoveCartItemDto {

    @IsArray()
    @ArrayNotEmpty({ message: '삭제할 상품을 선택해주세요.'})
    @Type(() => Number)
    @IsInt({ each: true})
    productSeqList: number[];
}