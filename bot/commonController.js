require('dotenv').config();
const { hwangBot } = require('./init.js');
const { commonCheck, sleep, killBird } = require('./util/helper.js');
const { getNoBirdMessage, getNoBirdCount, getNoBirdDelay } = require('./util/dbUtil.js')
const { logger } = require('../winston/logger.js')

hwangBot.on('message', async (msg) => {
	if (!commonCheck(msg)) return;

	killBird(msg).then(async (ans) => {
		if (!ans || ans != 'YES') return;

		const chatId = msg.chat.id;
		const messageId = msg.message_id;

		logger.info(`COMMON | Bird detected... < ${msg.chat.id}:${msg.message_id}:${msg.from.first_name}`)

		const NO_BIRD_MESSAGE = getNoBirdMessage();
		const NO_BIRD_COUNT = getNoBirdCount();
		const NO_BIRD_DELAY = getNoBirdDelay();

		hwangBot.sendMessage(chatId, `${NO_BIRD_MESSAGE}`, {
			reply_to_message_id: messageId
		});

		for (let i = 0; i < NO_BIRD_COUNT; i++) {
			hwangBot.sendMessage(
				chatId,
				`<a href="tg://user?id=${msg.from.id}">${NO_BIRD_MESSAGE}</a>`,
				{parse_mode: "HTML"}
			);
			await sleep(NO_BIRD_DELAY);
		}
	})
});

hwangBot.on("polling_error", (err) => {
	logger.error(`bot polling_error : ${err}`)
});