require('dotenv').config();
const hwangBot = require('@/init');
const {getPendingQueueItem } = require('@util/db/stickerDBUtil');
const logger = require ('@logger/logger');

setInterval(async () => {
    const jobs = getPendingQueueItem();

    if (!jobs.length) return;

    

}, 5000);