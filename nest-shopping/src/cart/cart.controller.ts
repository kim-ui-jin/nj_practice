import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { AddToCartDto } from './dto/cart.dto';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {

    constructor(private readonly cartService: CartService) { }

    // 장바구니 담기
    @Post('items')
    @UseGuards(JwtAuthGuard)
    async addToCart(@Req() req: any, @Body() addToCartDto: AddToCartDto) {
        return this.cartService.addItem(req.user.seq, addToCartDto);
    }

}
