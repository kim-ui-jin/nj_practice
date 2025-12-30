import { Inject, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class LoginAttemptService {

    private readonly logger = new Logger(LoginAttemptService.name);
    private readonly LOGIN_FAIL_LIMIT = 5;
    private readonly LOGIN_LOCK_SECONDS = 15 * 60;

    constructor(
        @Inject('REDIS') private readonly redis: Redis
    ) { }

    private getLoginFailKey(userId: string) {
        return `auth:login_fail:user:${userId}`
    }

    async assertNotLocked(userId: string) {
        const key = this.getLoginFailKey(userId);
        const failCount = Number((await this.redis.get(key)) ?? 0);

        if (failCount >= this.LOGIN_FAIL_LIMIT) {
            const ttlSec = await this.redis.ttl(key);
            const ttlMin = ttlSec > 0 ? Math.ceil(ttlSec / 60) : null;
            this.logger.warn(
                `Login locked. userId=${userId}, failCount=${failCount}, ttlSec=${ttlSec}, ttlMin=${ttlMin ?? 'unknown'}`
            );
            throw new UnauthorizedException(
                "로그인 시도 횟수가 초과되었습니다. 잠시 후 다시 시도해주세요."
            );
        }
    }

    async increaseLoginFail(userId: string) {
        const key = this.getLoginFailKey(userId);
        const cnt = await this.redis.incr(key);
        if (cnt === 1) {
            await this.redis.expire(key, this.LOGIN_LOCK_SECONDS);
        }
        return cnt;
    }

    async clearLoginFail(userId: string) {
        await this.redis.del(this.getLoginFailKey(userId));
    }

}