import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entity/product.entity';
import { Repository } from 'typeorm';
import { CreateProductDto, ProductCardDto, SearchByNameDto, UpdateProductDto, UpdateProductStatusDto } from './dto/product.dto';
import { instanceToPlain } from 'class-transformer';
import { ProductStatus } from 'src/common/enums/product-status.enum';
import { CommonResponse } from 'src/common/common-response';

const escapeLike = (s: string) => s.replace(/[%_]/g, (char) => '\\' + char);

type Paged<T> = { items: T[]; total: number; page: number; limit: number; hasNext: boolean; };

@Injectable()
export class ProductsService {

    constructor(
        @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    ) { }

    // 상품 등록
    async createProduct(
        userSeq: number,
        createProductDto: CreateProductDto
    ): Promise<CommonResponse<Product>> {

        const {
            name,
            price,
            stockQuantity,
            description,
            thumbnailUrl,
            imageUrls,
            status
        } = createProductDto;

        const product = this.productRepository.create({
            name,
            price,
            stockQuantity: stockQuantity ?? 0,
            description: description ?? null,
            thumbnailUrl: thumbnailUrl ?? null,
            imageUrls: imageUrls ?? null,
            status: status ?? ProductStatus.INACTIVE,
            creator: { seq: userSeq }
        });

        const saved = await this.productRepository.save(product);

        return {
            success: true,
            message: '상품 등록 성공',
            data: saved
        };


    }

    // 상품 썸네일 업로드
    async uploadThumbnail(
        file: Express.Multer.File
    ) {
        if (!file) throw new BadRequestException('썸네일 파일을 첨부하세요.');
        const thumbnailUrl = `/static/products/thumbnails/${file.filename}`;
        return thumbnailUrl;
    }

    // 상품 이미지 업로드
    async uploadImages(
        files: Express.Multer.File[]
    ) {
        if (!files || files.length === 0) throw new BadRequestException('최소 1개 이상의 이미지 파일을 첨부하세요.');
        const imageUrls = files.map(file => `/static/products/images/${file.filename}`);
        return imageUrls;
    }

    // 전체 조회
    async findAll(
        { status = ProductStatus.ACTIVE }
    ): Promise<Product[]> {
        return this.productRepository.find({
            where: { status },
            order: { seq: 'DESC' },
        });
    }

    // 단건 조회
    async findOneBySeq(
        productSeq: number
    ): Promise<Product> {
        const product = await this.productRepository.findOne({
            where: { seq: productSeq }
        });
        if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');

        return product;
    }

    // 내가 등록한 상품 삭제
    async removeProduct(
        productSeq: number,
        userSeq: number
    ): Promise<CommonResponse<void>> {

        const product = await this.productRepository.findOne({
            where: {
                seq: productSeq,
                creator: { seq: userSeq }
            }
        });
        if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');
        if (product.status === ProductStatus.DELETED) {
            throw new BadRequestException('이미 삭제된 상품입니다.');
        }

        product.status = ProductStatus.DELETED;
        await this.productRepository.save(product);

        return {
            success: true,
            message: '상품을 등록 취소했습니다.'
        };

    }

    // 내가 등록한 상품 조회
    async findMineByUserId(
        userSeq: number
    ): Promise<CommonResponse<Product[]>> {

        const products = await this.productRepository.find({
            where: { creator: { seq: userSeq } },
            order: { seq: 'DESC' }
        });
        if (products.length === 0) throw new NotFoundException('등록한 상품이 없습니다.');

        return {
            success: true,
            message: '내가 등록한 상품 조회 성공',
            data: products
        };

    }

    // 검색어로 상품 조회
    async searchByName(
        searchByNameDto: SearchByNameDto
    ): Promise<Paged<ProductCardDto>> {

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
            .where('product.status = :status', { status: ProductStatus.ACTIVE })
            .andWhere("product.name LIKE :keyword", { keyword: `%${escapeLike(keyword)}%` })
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

    // 상품 수정
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

    // 썸네일 수정
    async updateThumbnail(
        productSeq: number,
        userSeq: number,
        thumbnailUrl: string | null
    ): Promise<Product> {
        const product = await this.productRepository.findOne({
            where: { seq: productSeq },
            relations: { creator: true }
        });
        if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');
        if (product.creator.seq !== userSeq) {
            throw new ForbiddenException('본인이 등록한 상품만 수정할 수 있습니다.');
        }

        product.thumbnailUrl = thumbnailUrl;
        return this.productRepository.save(product);
    }

    // 이미지 수정
    async updateImages(
        productSeq: number,
        userSeq: number,
        imageUrls: string[] | null,
    ): Promise<Product> {
        const product = await this.productRepository.findOne({
            where: { seq: productSeq },
            relations: { creator: true }
        })
        if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');
        if (product.creator.seq !== userSeq) {
            throw new ForbiddenException('본인이 등록한 상품만 수정할 수 있습니다.');
        }

        product.imageUrls = imageUrls;
        return this.productRepository.save(product);
    }

    // 상품 상태 변경
    async updateProductStatus(
        productSeq: number,
        userSeq: number,
        updateProductStatusDto: UpdateProductStatusDto,
    ): Promise<CommonResponse<void>> {

        const { status } = updateProductStatusDto

        const product = await this.productRepository.findOne({
            where: {
                seq: productSeq,
                creator: { seq: userSeq }
            }
        });
        if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');

        product.status = status;

        await this.productRepository.save(product);

        return {
            success: true,
            message: '상품 상태 변경 성공',
        };

    }
}
