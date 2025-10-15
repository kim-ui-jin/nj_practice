import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, Req, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { ProductsService } from './products.service';
import { AddToCartDto, CreateProductDto, SearchByNameDto, UpdateProductDto, UpdateProductStatusDto, UpdateThumbnailDto } from './dto/product.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { RoleType } from 'src/common/enums/role-type.enum';
import { filenameFactory, imageFileFilter } from 'src/common/upload.util';
import { ProductStatus } from 'src/common/enums/product-status.enum';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    // 상품 등록
    // @Post()
    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles(RoleType.SELLER)
    // // 인터셉터: 컨트롤러 메서드 전/후에 끼어들어 요청,응답을 가로채 가공
    // @UseInterceptors(FileFieldsInterceptor([
    //     { name: 'thumbnail', maxCount: 1 },
    //     { name: 'images', maxCount: 10 },
    // ], {
    //     storage: diskStorage({
    //         destination: 'uploads/products',
    //         filename: filenameFactory,
    //     }),
    //     fileFilter: imageFileFilter,
    //     limits: { fileSize: 5 * 1024 * 1024, files: 11 },
    // }))
    // async createProduct(
    //     @Req() req: any,
    //     @Body() createProductDto: CreateProductDto,
    //     @UploadedFiles()
    //     files: {
    //         thumbnail?: Express.Multer.File[];
    //         images?: Express.Multer.File[];
    //     } = {},
    // ) {

    //     const thumbnailUrl = files.thumbnail?.[0] ? `/static/products/${files.thumbnail[0].filename}` : null;
    //     const imageUrls = files.images?.map(file => `/static/products/${file.filename}`) ?? [];
    //     const userSeq = req.user.seq;

    //     return this.productsService.createProduct(createProductDto, userSeq, thumbnailUrl, imageUrls);
    // }

    // 상품 등록
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleType.SELLER)
    async createProduct(
        @Req() req: any,
        @Body() createProductDto: CreateProductDto,
    ) {
        const userSeq = req.user.seq;
        return this.productsService.createProduct(createProductDto, userSeq);
    }

    // 썸네일 업로드
    @Post('uploads/thumbnail')
    @UseGuards(JwtAuthGuard)
    // 인터셉터: 컨트롤러 메서드 전/후에 끼어들어 요청,응답을 가로채 가공
    @UseInterceptors(FileInterceptor('thumbnail', {
        storage: diskStorage({
            destination: 'uploads/products/thumbnails',
            filename: filenameFactory
        }),
        fileFilter: imageFileFilter,
        limits: { fileSize: 5 * 1024 * 1024, files: 1 }
    }))
    async uploadThumbnail(
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) throw new BadRequestException('썸네일 파일을 첨부하세요.');

        const thumbnailUrl = `/static/products/thumbnails/${file.filename}`;

        return thumbnailUrl;
    }

    // 상품 이미지 업로드
    @Post('uploads/images')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FilesInterceptor('images', 10, {
        storage: diskStorage({
            destination: 'uploads/products/images',
            filename: filenameFactory,
        }),
        fileFilter: imageFileFilter,
        limits: { fileSize: 5 * 1024 * 1024, files: 10 },
    }))
    async uploadImages(
        @UploadedFiles() files: Express.Multer.File[],
    ) {
        if (!files || files.length === 0) {
            throw new BadRequestException('최소 1개 이상의 이미지 파일을 첨부하세요.');
        }

        const imageUrls = files.map(file => `/static/products/images/${file.filename}`);

        return imageUrls;
    }

    // 내가 등록한 상품 조회
    @Get('mine')
    @UseGuards(JwtAuthGuard)
    async findMine(@Req() req: any) {
        return this.productsService.findMineByUserId(req.user.seq);
    }

    @Get('search')
    async searchByName(@Query() searchByNameDto: SearchByNameDto) {
        return this.productsService.searchByName(searchByNameDto)
    }

    // 전체 조회
    @Get()
    async findAll(
        @Query('status') status = ProductStatus.ACTIVE,
    ) {
        return this.productsService.findAll({ status });
    }

    // 상품 단건 조회
    @Get(':seq')
    async findOne(@Param('seq', ParseIntPipe) seq: number) {
        return this.productsService.findOneBySeq(seq);
    }

    // 상품 등록 취소
    @Delete(':seq')
    @UseGuards(JwtAuthGuard)
    async removeProduct(@Param('seq') seq: number, @Req() req: any) {
        const meSeq = req.user.seq;
        return this.productsService.removeProduct(seq, meSeq);
    }

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

    // 장바구니 담기
    @Post('items')
    @UseGuards(JwtAuthGuard)
    async addToCart(@Req() req: any, @Body() addToCartDto: AddToCartDto) {
        return this.productsService.addItem(req.user.seq, addToCartDto);
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

    // 상품 상태 변경
    @Patch(':id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleType.SELLER)
    async updateProductStatus(
        @Param('id') id: number,
        @Req() req: any,
        @Body() updateProductStatusDto: UpdateProductStatusDto
    ) {
        const userSeq = req.user.seq;
        return this.productsService.updateProductStatus(id, userSeq, updateProductStatusDto);
    }
}