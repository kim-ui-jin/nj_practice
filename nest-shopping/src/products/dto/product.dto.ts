import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateProductDto {

    @IsString()
    @IsNotEmpty({ message: '상품명을 입력해 주세요.' })
    name: string;

    @IsInt()
    @Min(0)
    @IsNotEmpty({ message: '가격을 입력해 주세요.' })
    price: number;

    @IsInt()
    @Min(0)
    @IsOptional()
    stockQuantity?: number;

    @IsString()
    @IsOptional()
    description?: string;
}