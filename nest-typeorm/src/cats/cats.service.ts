import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cat } from '../domain/entity/cats.entity';
import { getConnection, Repository } from 'typeorm';
import { CatDto } from './dto/cat.dto';

@Injectable()
export class CatsService {
    constructor(
        @InjectRepository(Cat)
        private catsRepository: Repository<Cat>,
    ) { }

    findAll(): Promise<Cat[]> {
        return this.catsRepository.find();
    }

    findOne(id: number): Promise<Cat | null> {
        return this.catsRepository.findOne({ where: { id } });
    }

    async create(cat: Cat): Promise<void> {
        await this.catsRepository.save(cat);
    }

    async remove(id: number): Promise<void> {
        await this.catsRepository.delete(id);
    }

    async update(id: number, dto: CatDto): Promise<void> {
        // 데이터가 있을 경우만 처리
        const existedCat = await this.catsRepository
            .createQueryBuilder() // SQL을 직접 다루는 것처럼 세밀하게 쿼리를 만들 수 있게 해주는 TypeORM 기능
            .update(Cat) // Cat 엔티티에 대해 UPDATE 쿼리를 실행하겠다는 의미
            .set({ // 실제로 수정할 컬럼과 값 지정
                name: dto.name,
                age: dto.age,
                breed: dto.breed
            })
            .where("id=:id", { id }) // 조건절 지정 :id는 바인딩 변수이고 { id } 값이 들어감
            .execute(); // 실제 DB에 쿼리를 날림 실행 결과를 existedCat에 담음

        if (existedCat.affected === 0) { // 몇 개의 행이 수정 되었는지를 알려주는 숫자 만약 업데이트 된 행이 0개라면 NotFoundException을 날림
            throw new NotFoundException(`Cat With id #${id} not found`);
        }

    }
}
