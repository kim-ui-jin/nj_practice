import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Req, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { extname } from 'path';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

function filenameFactory(req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + extname(file.originalname));
}

function imageFileFilter(req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
    }
    cb(null, true);
}

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    // 상품 등록
    @Post()
    @UseGuards(JwtAuthGuard)
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
        const userId = req.user.userId;

        return this.productsService.createProduct(createProductDto, userId, imageUrls);
    }

    // 내가 등록한 상품 조회
    @Get('mine')
    @UseGuards(JwtAuthGuard)
    async findMine(@Req() req: any) {
        return this.productsService.findMineByUserId(req.user.userId);
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
        const meUserId = req.user.userId;
        return this.productsService.removeProduct(seq, meUserId);
    }


}
