require('module-alias/register');
require('./bot/contoller/commonController');
require('./bot/contoller/adminController');
require('./bot/contoller/stickerController');
const { logger } = require('./winston/logger');

logger.info(`Bot Started`);

Error.stackTraceLimit = 50;