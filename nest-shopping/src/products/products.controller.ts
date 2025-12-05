import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, Req, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, SearchByNameDto, UpdateImagesDto, UpdateProductDto, UpdateProductStatusDto, UpdateThumbnailDto } from './dto/product.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { RoleType } from 'src/common/enums/role-type.enum';
import { ProductStatus } from 'src/common/enums/product-status.enum';
import { imagesMulterOptions, thumbnailMulterOptions } from 'src/common/upload.util';
import { Product } from './entity/product.entity';
import { CommonResponse } from 'src/common/common-response';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    // 상품 등록
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles(RoleType.SELLER)
    async createProduct(
        @Req() req: any,
        @Body() createProductDto: CreateProductDto,
    ) {
        const userSeq = req.user.seq;
        return this.productsService.createProduct(userSeq, createProductDto);
    }

    // 썸네일 업로드
    @Post('uploads/thumbnail')
    @UseGuards(JwtAuthGuard)
    // 인터셉터: 컨트롤러 메서드 전/후에 끼어들어 요청,응답을 가로채 가공
    @UseInterceptors(FileInterceptor('thumbnail', thumbnailMulterOptions))
    async uploadThumbnail(
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.productsService.uploadThumbnail(file);
    }

    // 상품 이미지 업로드
    @Post('uploads/images')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FilesInterceptor('images', 10, imagesMulterOptions))
    async uploadImages(
        @UploadedFiles() files: Express.Multer.File[],
    ) {
        return this.productsService.uploadImages(files);
    }

    // 내가 등록한 상품 조회
    @Get('mine')
    @UseGuards(JwtAuthGuard)
    async findMine(
        @Req() req: any
    ): Promise<CommonResponse<Product[]>> {
        const userSeq = req.user.seq;
        return this.productsService.findMineByUserId(userSeq);
    }

    // 상품명으로 검색
    @Get('search')
    async searchByName(
        @Query() searchByNameDto: SearchByNameDto,
    ) {
        return this.productsService.searchByName(searchByNameDto)
    }

    // 전체 조회
    @Get()
    async findAll() {
        return this.productsService.findAll({ status: ProductStatus.ACTIVE });
    }

    // 상품 단건 조회
    @Get(':productSeq')
    async findOne(
        @Param('productSeq', ParseIntPipe) productSeq: number
    ): Promise<Product> {
        return this.productsService.findOneBySeq(productSeq);
    }

    // 상품 등록 취소
    @Delete(':productSeq')
    @UseGuards(JwtAuthGuard)
    async removeProduct(
        @Param('productSeq', ParseIntPipe) productSeq: number,
        @Req() req: any
    ): Promise<CommonResponse<void>> {
        const userSeq = req.user.seq;
        return this.productsService.removeProduct(productSeq, userSeq);
    }

    // 상품 업데이트
    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleType.SELLER)
    async updateProduct(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: any,
        @Body() updateProductDto: UpdateProductDto,
    ) {
        const userSeq = req.user.seq;
        return this.productsService.updateProduct(id, userSeq, updateProductDto);
    }

    // 썸네일 수정
    @Put(':id/thumbnail')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleType.SELLER)
    async updateThumbnail(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: any,
        @Body() updateThumbnailDto: UpdateThumbnailDto
    ) {
        const userSeq = req.user.seq;
        return this.productsService.updateThumbnail(id, userSeq, updateThumbnailDto.thumbnailUrl ?? null)
    }

    // 이미지 수정
    @Put(':id/images')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleType.SELLER)
    async updateImages(
        @Param('id') id: number,
        @Req() req: any,
        @Body() updateImagesDto: UpdateImagesDto,
    ) {
        const userSeq = req.user.seq;
        return this.productsService.updateImages(id, userSeq, updateImagesDto.imageUrls ?? null);
    }

    // 상품 상태 변경
    @Patch(':productSeq/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleType.SELLER)
    async updateProductStatus(
        @Param('productSeq', ParseIntPipe) productSeq: number,
        @Req() req: any,
        @Body() updateProductStatusDto: UpdateProductStatusDto
    ): Promise<CommonResponse<void>> {
        const userSeq = req.user.seq;
        return this.productsService.updateProductStatus(productSeq, userSeq, updateProductStatusDto);
    }
}