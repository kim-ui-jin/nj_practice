import { Transform, Type } from "class-transformer";
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";
import { Product } from "../entity/product.entity";

export class CreateProductDto {

    @IsString()
    @MaxLength(120, { message: '상품명은 최대 120자까지 가능합니다.' })
    @IsNotEmpty({ message: '상품명을 입력해 주세요.' })
    name: string;

    @Type(() => Number)
    @IsInt({ message: '가격은 정수여야 합니다.' })
    @Min(1, { message: '가격은 1원 이상이어야 합니다.' })
    @IsNotEmpty({ message: '가격을 입력해 주세요.' })
    price: number;

    @Type(() => Number)
    @IsInt()
    @Min(0)
    @IsOptional()
    stockQuantity?: number;

    @IsString()
    @IsOptional()
    description?: string;
}

export class SearchByNameDto {

    @IsString()
    @MinLength(1, { message: '검색어를 입력하세요.' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    keyword: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 12;
}

export class ProductCardDto {
    id: number;
    name: string;
    price: number;
    thumbnailUrl: string | null;
    shortDescription: string | null;
    inStock: boolean;
    createdAt: string;

    static fromEntity(product: Product, createdAt: string): ProductCardDto {
        return {
            id: product.seq,
            name: product.name,
            price: product.price,
            thumbnailUrl: product.imageUrls?.[0] ?? null,
            shortDescription: product.description?.slice(0, 80) ?? null,
            inStock: (product.stockQuantity ?? 0) > 0,
            createdAt,
        };
    }

}

export class UpdateProductDto {

    @IsOptional()
    @IsString()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsNotEmpty({ message: '상품명을 입력해주세요.' })
    name?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    price?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    stockQuantity?: number;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsNotEmpty({ message: '설명을 입력해 주세요.' })
    description?: string | null;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    imageUrls?: string[] | null;
}

export class AddToCartDto {

    @Type(() => Number)
    @IsInt()
    @Min(1)
    productSeq: number;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    quantity: number;
}