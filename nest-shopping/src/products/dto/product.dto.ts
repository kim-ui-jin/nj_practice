import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString, Min, MinLength } from "class-validator";
import { Product } from "../entity/product.entity";

export class CreateProductDto {

    @IsString()
    @IsNotEmpty({ message: '상품명을 입력해 주세요.' })
    name: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
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
    keyword: string;
}

export class ProductCardDto {
    id: number;
    name: string;
    price: number;
    thumbnailUrl: string | null;
    shortDescription: string | null;
    inStock: boolean;
    createdAt: string;

    static fromEntity(product: Product): ProductCardDto {
        return {
            id: product.seq,
            name: product.name,
            price: product.price,
            thumbnailUrl: product.imageUrls?.[0] ?? null,
            shortDescription: product.description?.slice(0, 80) ?? null,
            inStock: (product.stockQuantity ?? 0) > 0,
        } as any;
    }
}