import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entity/product.entity';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/product.dto';
import { BaseResponseDto } from 'src/common/dto/base_response.dto';

@Injectable()
export class ProductsService {

    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>
    ) { }

    // 상품 등록
    async createProduct(createProductDto: CreateProductDto): Promise<Product> {

        const product = this.productRepository.create({
            name: createProductDto.name,
            price: createProductDto.price,
            stockQuantity: createProductDto.stockQuantity ?? 0,
            description: createProductDto.description ?? null,
        })

        return await this.productRepository.save(product);
    }

    // 전체 조회
    async findAll(): Promise<Product[]> {
        return this.productRepository.find({ order: { seq: 'DESC' } })
    }

    // 단건 조회
    async findOneBySeq(seq: number) {

        const product = await this.productRepository.findOne({ where: { seq } });
        if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');

        return product;
    }

    // 상품 삭제
    async removeProduct(seq: number): Promise<BaseResponseDto> {

        const result = await this.productRepository.delete({ seq });

        if (!result.affected) throw new NotFoundException('상품을 찾을 수 없습니다.');

        return { success: true, message: '상품을 등록 취소했습니다.'}

    }

}
