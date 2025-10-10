import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { ProductsService } from './products.service';
import { AddToCartDto, CreateProductDto, SearchByNameDto, UpdateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { RoleType } from 'src/auth/enums/role-type.enum';
import { filenameFactory, imageFileFilter } from 'src/common/upload.util';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    // 상품 등록
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleType.SELLER)
    // 인터셉터: 컨트롤러 메서드 전/후에 끼어들어 요청,응답을 가로채 가공
    @UseInterceptors(FilesInterceptor('images', 10, {
        storage: diskStorage({
            destination: 'uploads/products',
            filename: filenameFactory,
        }),
        fileFilter: imageFileFilter,
        limits: { fileSize: 5 * 1024 * 1024, files: 10 },
    }))
    async createProduct(
        @Req() req: any,
        @Body() createProductDto: CreateProductDto,
        @UploadedFiles() files: Express.Multer.File[] = [],
    ) {

        const imageUrls = files.map(file => `/static/products/${file.filename}`);
        const userSeq = req.user.seq;

        return this.productsService.createProduct(createProductDto, userSeq, imageUrls);
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
    async findAll() {
        return this.productsService.findAll();
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
    @UseInterceptors(
        FilesInterceptor('images', 10, {
            storage: diskStorage({
                destination: 'uploads/products',
                filename: filenameFactory,
            }),
            fileFilter: imageFileFilter,
            limits: { fileSize: 5 * 1024 * 1024, files: 10 },
        }),
    )
    async updateProduct(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: any,
        @Body() updateProductDto: UpdateProductDto,
        @UploadedFiles() files: Express.Multer.File[] = [],
    ) {
        const userSeq = req.user.seq;
        const newImageUrls = files.length ? files.map(file => `/static/products/${file.filename}`) : undefined;

        return this.productsService.updateProduct(id, userSeq, updateProductDto, newImageUrls);
    }

    // 장바구니 담기
    @Post('items')
    @UseGuards(JwtAuthGuard)
    async addToCart(@Req() req: any, @Body() addToCartDto: AddToCartDto) {
        return this.productsService.addItem(req.user.seq, addToCartDto);
    }
}
