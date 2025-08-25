import { Injectable } from '@nestjs/common';
import { Cat } from './interface/cat.interface';

@Injectable()
export class CatsService {
    private readonly cats: Cat[] = [];

    // 전달받은 Cat 객체를 this.cats 배열에 추가하여 저장하는 메서드
    create(cat: Cat) {
        this.cats.push(cat);
    }

    // cats 배열에 저장된 모든 Cat 객체를 반환하는 메서드
    findeAll(): Cat[] {
        return this.cats;
    }
}
