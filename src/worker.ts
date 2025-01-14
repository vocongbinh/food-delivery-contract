import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { deployNFT } from './jobs';

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
const worker = new Worker('contract', async job => {
    await deployNFT(job.data);
    console.log(`Processing job: ${job.id}`);
}, { connection:  redis});

worker.on('completed', job => {
    console.log(`Job ${job.id} đã hoàn thành.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} đã thất bại với lỗi: ${err.message}`);
    console.error(err.stack);
});