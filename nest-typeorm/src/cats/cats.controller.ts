import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CatsService } from './cats.service';
import { Cat } from './entity/cats.entity';

@Controller('cats')
export class CatsController {
    constructor(private catsService: CatsService) { };

    // 전체 조회
    @Get()
    findAll(): Promise<Cat[]> {
        return this.catsService.findAll();
    }

    // 단건 조회
    @Get(':id')
    findOne(@Param('id') id: number): Promise<Cat | null> {
        return this.catsService.findOne(id);
    }

    // cat 데이터 생성
    @Post()
    create(@Body() cat: Cat) {
        this.catsService.create(cat);
    }

    // cat 데이터 삭제
    @Delete(':id')
    remove(@Param('id') id: number) {
        this.catsService.remove(id);
    }

    // 정보 수정
    @Put(':id')
    update(@Param('id') id: number, @Body() cat: Cat) {
        this.catsService.update(id, cat);
        return `This action updates a #${id} cat`;
    }
}
