import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entity/product.entity';
import { Not, Repository } from 'typeorm';
import { AddToCartDto, CreateProductDto, ProductCardDto, SearchByNameDto, UpdateProductDto, UpdateProductStatusDto, UpdateThumbnailDto } from './dto/product.dto';
import { BaseResponseDto } from 'src/common/dto/base_response.dto';
import { instanceToPlain } from 'class-transformer';
import { ProductCart } from './entity/product-cart.entity';
import { ProductStatus } from 'src/common/enums/product-status.enum';

const escapeLike = (s: string) => s.replace(/[%_]/g, (char) => '\\' + char);

type Paged<T> = { items: T[]; total: number; page: number; limit: number; hasNext: boolean; };

@Injectable()
export class ProductsService {

    constructor(
        @InjectRepository(Product) private readonly productRepository: Repository<Product>,
        @InjectRepository(ProductCart) private readonly productCartRepository: Repository<ProductCart>
    ) { }

    // 상품 등록
    async createProduct(
        createProductDto: CreateProductDto,
        userSeq: number
    ): Promise<Product> {

        const product = this.productRepository.create({
            name: createProductDto.name,
            price: createProductDto.price,
            stockQuantity: createProductDto.stockQuantity ?? 0,
            description: createProductDto.description ?? null,
            thumbnailUrl: createProductDto.thumbnailUrl ?? null,
            imageUrls: createProductDto.imageUrls ?? null,
            status: createProductDto.status ?? ProductStatus.INACTIVE,
            creator: { seq: userSeq }
        })

        try {
            return await this.productRepository.save(product);
        } catch (e) {
            throw new InternalServerErrorException('상품 등록 중 오류가 발생했습니다.')
        }

    }

    // 전체 조회
    async findAll({ status = ProductStatus.ACTIVE }): Promise<Product[]> {
        return this.productRepository.find({
            where: { status },
            order: { seq: 'DESC' },
        });
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

        const { keyword, page, limit } = searchByNameDto;

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

        // 현재 페이지의 엔티티 배열과 전체 개수를 한 번에 가져옴 / getManyAndCount는 [엔티티배열, 총개수] 형태의 튜플을 반환
        const [rows, total] = await qb.getManyAndCount();
        // 전체가 0건이면 에러
        if (total === 0) throw new NotFoundException('검색 결과가 없습니다.');
        // 결과는 있지만 요청한 페이지 범위를 넘어가면(예: 2페이지가 끝인데 3페이지 요청) 에러
        if (skip >= total) throw new NotFoundException('요청한 페이지가 없습니다.');

        const items = rows.map((product) => {
            const plain = instanceToPlain(product)
            return ProductCardDto.fromEntity(product, plain.createdAt);
        });

        // 현재 페이지 아이템들, 전체 개수, 현재 페이지 정보, 다음페이지 존재 여부(현재까지 본 개수 < total)
        return { items, total, page, limit, hasNext: page * limit < total };
    }

    async updateProduct(
        id: number,
        userSeq: number,
        updateProductDto: UpdateProductDto
    ): Promise<Product> {

        const product = await this.productRepository.findOne({
            where: { seq: id },
            relations: { creator: true },
        });
        if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');
        if (product.creator.seq !== userSeq) {
            throw new ForbiddenException('본인이 등록한 상품만 수정할 수 있습니다.');
        }

        if (updateProductDto.name !== undefined) product.name = updateProductDto.name;
        if (updateProductDto.price !== undefined) product.price = updateProductDto.price;
        if (updateProductDto.stockQuantity !== undefined) product.stockQuantity = updateProductDto.stockQuantity;
        if (updateProductDto.description !== undefined) product.description = updateProductDto.description;

        try {
            return await this.productRepository.save(product);
        } catch (e) {
            throw new InternalServerErrorException('상품 수정 중 오류가 발생했습니다.')
        }

    }

    //상품을 장바구니에 담기
    async addItem(userSeq: number, addToCartDto: AddToCartDto) {

        const { productSeq, quantity } = addToCartDto;

        if (quantity < 1) throw new BadRequestException('수량은 1 이상이어야 합니다.');

        const product = await this.productRepository.findOne({ where: { seq: productSeq } });
        if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');
        if (product.stockQuantity <= 0) throw new BadRequestException('해당 상품은 품절입니다.');

        const result = await this.productCartRepository
            .createQueryBuilder()
            .update(ProductCart)
            .set({ quantity: () => `quantity + ${quantity}` })
            .where('user_seq = :userSeq AND product_seq = :productSeq', { userSeq, productSeq })
            .execute();

        if (result.affected === 0) {
            await this.productCartRepository.insert({
                user: { seq: userSeq },
                product: { seq: productSeq },
                quantity,
            });
        }

        const list = await this.productCartRepository.find({
            where: { user: { seq: userSeq } },
            relations: { product: true },
            order: { seq: 'DESC' },
        });

        return list

    }

    // 썸네일 수정
    async updateThumbnail(
        id: number,
        userSeq: number,
        thumbnailUrl: string | null
    ) {
        const product = await this.productRepository.findOne({
            where: { seq: id }
        });
        if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');

        product.thumbnailUrl = thumbnailUrl;

        return this.productRepository.save(product);
    }

    // 상품 상태 변경
    async updateProductStatus(
        id: number,
        userSeq: number,
        updateProductStatusDto: UpdateProductStatusDto,
    ) {
        const product = await this.productRepository.findOne({
            where: { seq: id },
            relations: { creator: true },
        });
        if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');
        if (product.creator.seq !== userSeq) {
            throw new ForbiddenException('본인이 등록한 상품만 상태를 변경할 수 있습니다.');
        }

        product.status = updateProductStatusDto.status;

        try {
            return await this.productRepository.save(product);
        } catch (e) {
            throw new InternalServerErrorException('상품 상태 변경 중 오류가 발생했습니다.');
        }
    }
}
