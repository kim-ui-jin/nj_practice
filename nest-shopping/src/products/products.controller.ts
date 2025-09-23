import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    // 상품 등록
    @Post()
    @UseGuards(JwtAuthGuard)
    async createProduct(@Req() req: any, @Body() createProductDto: CreateProductDto) {
        return this.productsService.createProduct(createProductDto, req.user.userId);
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
    async removeProduct(@Param('seq') seq: number) {
        return this.productsService.removeProduct(seq);
    }


}
