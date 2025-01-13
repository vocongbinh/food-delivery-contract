import { Queue } from 'bullmq';
import Redis from 'ioredis';
const redis = new Redis();
export const queue = new Queue('contract', {connection: {
    host: 'oregon-redis.render.com',
    port: 6379,
    username: 'red-cu2ifhpu0jms73d9icng',
    password: 'dbgs9sD1PB90NjiWGNvGyK0fJsYdEujj',
    tls: {} 
}});
