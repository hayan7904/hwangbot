require('module-alias/register');
require('./bot/contoller/commonController');
require('./bot/contoller/adminController');
require('./bot/contoller/stickerController');
require('./bot/contoller/doubleController');
require('./bot/job/worker');
const logger = require('./winston/logger');

logger.info(`Bot Started`);

Error.stackTraceLimit = 50;