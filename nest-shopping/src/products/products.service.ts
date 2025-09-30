import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entity/product.entity';
import { Repository } from 'typeorm';
import { CreateProductDto, ProductCardDto, SearchByNameDto } from './dto/product.dto';
import { BaseResponseDto } from 'src/common/dto/base_response.dto';
import { instanceToPlain } from 'class-transformer';

const escapeLike = (s: string) => s.replace(/[%_]/g, (char) => '\\' + char);

type Paged<T> = { items: T[]; total: number; page: number; limit: number; hasNext: boolean; };

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

    // 검색어로 상품 조회
    async searchByName(searchByNameDto: SearchByNameDto): Promise<Paged<ProductCardDto>> {

        const keyword = searchByNameDto.keyword.trim();
        if (!keyword) throw new BadRequestException('검색어를 입력하세요.');

        const page = searchByNameDto.page ?? 1;
        const limit = searchByNameDto.limit ?? 12;

        // DB에서 건너뛸 개수 계산 (ex: page=3, limit=12 -> skip=24)
        const skip = (page - 1) * limit;

        const qb = this.productRepository.createQueryBuilder('product')
            .select([
                'product.seq',
                'product.name',
                'product.price',
                'product.imageUrls',
                'product.description',
                'product.stockQuantity',
                'product.createdAt',
            ])
            .where("product.name LIKE :keyword", { keyword: `%${escapeLike(keyword)}%` })
            .orderBy('product.name', 'ASC')
            .addOrderBy('product.seq', 'ASC')
            // 결과에서 앞의 skip개 행을 건너뛰기
            .skip(skip)
            // 건너뛴 뒤 limit개 행만 가져오기
            .take(limit);

        // 현재 페이지의 행들과 전체 개수를 한 번에 가져옴 / getManyAndCount는 [엔티티배열, 총개수] 형태의 튜플을 반환
        const [rows, total] = await qb.getManyAndCount();
        if (total === 0) throw new NotFoundException('검색 결과가 없습니다.');
        if (skip >= total) throw new NotFoundException('요청한 페이지가 없습니다.');

        const items = rows.map((product) => {
            const plain = instanceToPlain(product)
            return ProductCardDto.fromEntity(product, plain.createdAt);
        });

        return { items, total, page, limit, hasNext: page * limit < total };
    }
}
