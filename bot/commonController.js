require('dotenv').config();
const { hwangBot } = require('./init.js');
const { commonCheck, killBird } = require('./util/helper.js');
const VARS = require('./util/variables.js')
const { logger } = require('../winston/logger.js')

hwangBot.on('message', async (msg) => {
	if (!commonCheck(msg)) return;

	killBird(msg).then(async (ans) => {
		if (!ans) return;

		const chatId = msg.chat.id;
		const messageId = msg.message_id;

		logger.info(`Bird detected... < ${msg.chat.id}:${msg.message_id}:${msg.from.first_name}`)

		hwangBot.sendMessage(chatId, '조류 그만!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!', {
			reply_to_message_id: messageId
		});

		for (let i = 0; i < VARS.NO_BIRD_COUNT; i++) {
			hwangBot.sendMessage(
				chatId,
				`<a href="tg://user?id=${msg.from.id}">조류 그만!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!</a>`,
				{parse_mode: "HTML"}
			);
			await sleep(500);
		}
	})
});

hwangBot.on("polling_error", console.log);