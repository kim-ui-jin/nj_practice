import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { TagsService } from './tags.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { CommonResponse } from 'src/common/common-response';
import { Tag } from './entity/tag.entity';

@Controller('tags')
export class TagsController {
    constructor(
        private readonly tagsService: TagsService
    ) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    async createTag(
        @Body('tagName') tagName: string
    ): Promise<CommonResponse<Tag>> {
        return this.tagsService.createTag(tagName);
    }
}
