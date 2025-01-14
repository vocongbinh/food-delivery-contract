import { Queue } from 'bullmq';
import Redis from 'ioredis';
const redisUrl = 'rediss://red-cu2ifhpu0jms73d9icng:dbgs9sD1PB90NjiWGNvGyK0fJsYdEujj@oregon-redis.render.com:6379';
const parsedUrl = new URL(redisUrl);

const redis = new Redis({
    host: parsedUrl.hostname,
    port: Number(parsedUrl.port),
    username: parsedUrl.username,
    password: parsedUrl.password,
    tls: parsedUrl.protocol === 'rediss:' ? {} : undefined,
    maxRetriesPerRequest: null
});
export const queue = new Queue('contract', {connection: redis});
