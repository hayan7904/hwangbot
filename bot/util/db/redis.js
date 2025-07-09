require('dotenv').config();
const Redis = require('ioredis');
const logger = require('@logger/logger');

const redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    maxRetriesPerRequest: null,
}).once('connect', () => logger.info(`Redis Connection : redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`));

module.exports = redisClient;