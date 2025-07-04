process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

require('module-alias/register');
require('./bot/contoller/commonController');
require('./bot/contoller/adminController');
require('./bot/contoller/stickerController');
require('./bot/job/worker');
const logger = require('./winston/logger');

logger.info(`Bot Started`);

Error.stackTraceLimit = 50;