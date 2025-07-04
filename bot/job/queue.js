const { Queue } = require('bullmq');
const redisClient = require('@util/db/redis');

const stickerQueue = new Queue('stickerQueue', {
    connection: redisClient,
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
    },
});

module.exports = stickerQueue;