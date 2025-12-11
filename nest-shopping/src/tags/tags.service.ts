import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tag } from './entity/tag.entity';
import { Repository } from 'typeorm';
import { CommonResponse } from 'src/common/common-response';

@Injectable()
export class TagsService {
    constructor(
        @InjectRepository(Tag) private readonly tagRepository: Repository<Tag>
    ) { }

    // 태그 생성
    async createTag(
        tagName: string
    ): Promise<CommonResponse<Tag>> {
        const trimmed = tagName.trim().toLowerCase();
        if (!trimmed) {
            throw new BadRequestException('태그를 입력하세요');
        }

        const exist = await this.tagRepository.findOne({
            where: { tagName: trimmed }
        });
        if (exist) throw new ConflictException('이미 존재하는 태그입니다.');

        const tag = this.tagRepository.create({ tagName: trimmed });
        const saved = await this.tagRepository.save(tag);

        return {
            success: true,
            message: '태그 생성 성공',
            data: saved
        }
    }
}
