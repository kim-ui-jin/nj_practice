import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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
    async createProduct(
        createProductDto: CreateProductDto,
        seq: number,
        imageUrls: string[] | null,
    ): Promise<Product> {

        const product = this.productRepository.create({
            name: createProductDto.name,
            price: createProductDto.price,
            stockQuantity: createProductDto.stockQuantity ?? 0,
            description: createProductDto.description ?? null,
            imageUrls,
            creator: { seq }
        })

        try {
            return await this.productRepository.save(product);
        } catch (e) {
            throw new InternalServerErrorException('상품 등록 중 오류가 발생했습니다.')
        }

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

    // 내가 등록한 상품 삭제
    async removeProduct(seq: number, meSeq: number): Promise<BaseResponseDto> {

        try {

            const result = await this.productRepository
                .createQueryBuilder()
                .delete()
                .from(Product)
                .where('seq = :seq AND created_by_user_seq = :useq', { seq, useq: meSeq })
                .execute();

            if (!result.affected) throw new NotFoundException('상품을 찾을 수 없습니다.');

            return { success: true, message: '상품을 등록 취소했습니다.' }

        } catch (e) {
            throw new InternalServerErrorException('상품 삭제 처리 중 오류가 발생했습니다.');
        }

    }

    // 내가 등록한 상품 조회
    async findMineByUserId(seq: number): Promise<Product[]> {

        const meProducts = await this.productRepository.find({
            where: { creator: { seq } },
            order: { seq: 'DESC' }
        });

        return meProducts;
    }

}
