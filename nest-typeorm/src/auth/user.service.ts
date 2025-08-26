import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entity/user.entity";
import { FindOneOptions, Repository } from "typeorm";
import { UserDTO } from "./dto/user.dto";

@Injectable()
export class UserService {
    constructor(@InjectRepository(User) private userRepository: Repository<User>) { }

    // 사용자가 이미 등록이 되었는지 확인 하는 함수
    findByFields(options: FindOneOptions<User>): Promise<User | null> {
        return this.userRepository.findOne(options)
    }

    // 사용자 등록
    // DTO -> 엔티티로 변환 후 저장
    async save(userDTO: UserDTO): Promise<User> {
        const entity = this.userRepository.create(userDTO); // 매핑
        return this.userRepository.save(entity);            // 저장 후 엔티티 반환
    }
}
