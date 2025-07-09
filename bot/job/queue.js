const { Queue, QueueScheduler } = require('bullmq');
const redisClient = require('@util/db/redis');
const logger = require('@logger/logger');

const stickerQueue = new Queue('stickerQueue', {
    connection: redisClient,
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
    },
});

const recoverQueue = async () => {
    const activeQueue = await stickerQueue.getActive();
    
    for (const job of activeQueue) {
        const data = job.data;
        
        await job.moveToWait();

        logger.info(`ADMIN | STICKER | [${data.conId} | ${data.conTitle}] Moved to waitng queue`);
    }
}

recoverQueue().catch(err => {
    logger.error(err.stack);
});

module.exports = stickerQueue;