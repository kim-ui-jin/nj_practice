import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export const typeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
    type: configService.getOrThrow<'mysql'>('DB_TYPE'),
    host: configService.getOrThrow<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT', 3306),
    username: configService.getOrThrow<string>('DB_USERNAME'),
    password: configService.getOrThrow<string>('DB_PASSWORD'),
    database: configService.getOrThrow<string>('DB_DATABASE'),

    // forFeature로 등록한 엔티티를 자동으로 연결
    autoLoadEntities: true,
    
    synchronize: configService.getOrThrow<boolean>('DB_SYNC'),
    logging: configService.get<boolean>('DB_LOGGING', true),
});