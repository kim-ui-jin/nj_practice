import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

const isProd = process.env.NODE_ENV === 'production';

dotenv.config({
    path: isProd ? '.env.production' : '.env'
});

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: ['src/**/*.entity.{ts,js}'],
    migrations: ['src/database/migrations/*.{ts,js}'],
    synchronize: false,
    logging: false
});

export default AppDataSource;