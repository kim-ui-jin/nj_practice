import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { AddToCartDto, RemoveCartItemDto, UpdateQuantityDto } from './dto/cart.dto';
import { CartService } from './cart.service';
import { CommonResponse } from 'src/common/common-response';
import { GetCartItems } from 'src/orders/type/order.type';

@Controller('cart')
export class CartController {

    constructor(private readonly cartService: CartService) { }

    // 장바구니 담기
    @Post('items')
    @UseGuards(JwtAuthGuard)
    async addToCart(
        @Req() req: any,
        @Body() addToCartDto: AddToCartDto,
    ): Promise<CommonResponse<{ productSeq: number; quantity: number }>> {
        const userSeq = req.user.seq;
        return this.cartService.addItem(userSeq, addToCartDto);
    }

    // 장바구니 목록
    @Get('items')
    @UseGuards(JwtAuthGuard)
    async getCartItems(
        @Req() req: any
    ): Promise<CommonResponse<GetCartItems>> {
        const userSeq = req.user.seq;
        return this.cartService.getCartItems(userSeq)
    }

    // 장바구니 상품 삭제
    @Delete('items')
    @UseGuards(JwtAuthGuard)
    async removeCartItem(
        @Req() req: any,
        @Body() removeCartItemDto: RemoveCartItemDto
    ): Promise<CommonResponse<void>> {
        const userSeq = req.user.seq;
        return this.cartService.removeCartItem(userSeq, removeCartItemDto);
    }

    // 장바구니 비우기
    @Delete('items/all')
    @UseGuards(JwtAuthGuard)
    async clearCartItems(
        @Req() req: any
    ): Promise<CommonResponse<void>> {
        const userSeq = req.user.seq;
        return this.cartService.clearCartItems(userSeq);
    }

    // 수량 변경
    @Patch('items')
    @UseGuards(JwtAuthGuard)
    async updateQuantity(
        @Req() req: any,
        @Body() updateQuantityDto: UpdateQuantityDto,
    ): Promise<CommonResponse<{ productSeq: number; newQuantity: number }>> {
        const userSeq = req.user.seq;
        return this.cartService.updateQuantity(userSeq, updateQuantityDto);
    }

    // 장바구니 개수 조회 (헤더용)
    @Get('items/count')
    @UseGuards(JwtAuthGuard)
    async getCartItemCount(
        @Req() req: any
    ): Promise<CommonResponse<{ itemCount: number }>> {
        const userSeq = req.user.seq;
        return this.cartService.getCartItemCount(userSeq);
    }

}
