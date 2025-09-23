import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    // 상품 등록
    @Post()
    @UseGuards(JwtAuthGuard)
    async createProduct(@Body() createProductDto: CreateProductDto) {
        return this.productsService.createProduct(createProductDto);
    }

    // 전체 조회
    @Get()
    async findAll() {
        return this.productsService.findAll();
    }

    // 상품 단건 조회
    @Get(':seq')
    async findOne(@Param('seq') seq: number) {
        return this.productsService.findOneBySeq(seq);
    }

    // 상품 등록 취소
    @Delete(':seq')
    @UseGuards(JwtAuthGuard)
    async removeProduct(@Param('seq') seq: number) {
        return this.productsService.removeProduct(seq);
    }

}
