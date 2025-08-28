import { TypeOrmModuleOptions } from "@nestjs/typeorm";

function ormConfig(): TypeOrmModuleOptions {
    const commonConf = {
        SYNCRONIZE: false,
        ENTITIES: [__dirname + '/**/*.entity{.ts,.js}'],
        MIGRATIONS: [__dirname + '/migration/**/*{.ts,.js}'],
        MIGRATIONS_RUN: false,
    };

    const ormconfig: TypeOrmModuleOptions = {
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: '12345',
        database: 'test',
        entities: commonConf.ENTITIES,
        synchronize: commonConf.SYNCRONIZE,
        logging: true,
        migrations: commonConf.MIGRATIONS,
        migrationsRun: commonConf.MIGRATIONS_RUN
    }

    return ormconfig;
}

export { ormConfig }