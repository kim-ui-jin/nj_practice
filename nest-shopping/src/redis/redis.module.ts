import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';

@Global()
@Module({
    providers: [{
        provide: 'REDIS',
        useFactory: () => {
            return new Redis({
                host: process.env.REDIS_HOST,
                port: Number(process.env.REDIS_PORT)
            });
        }
    }],
    exports: ['REDIS']
})
export class RedisModule {}
