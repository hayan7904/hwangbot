require('dotenv').config();
const { hwangBot } = require('@/init.js');
const { commonBlackCheck, sleep, killBird } = require('@util/commonHelper.js');
const { getNoBirdMessage, getNoBirdCount, getNoBirdDelay } = require('@util/db/commonDBUtil.js')
const { logger } = require('@logger/logger.js')

hwangBot.on('message', async (msg) => {
	if (!commonBlackCheck(msg)) return;

	const ans = await killBird(msg);

	if (!ans || ans != 'YES') return;

	const chatId = msg.chat.id;
	const messageId = msg.message_id;

	logger.info(`COMMON | Bird Detected < ${msg.chat.id} | ${msg.message_id} | ${msg.from.first_name}`);

	const NO_BIRD_MESSAGE = getNoBirdMessage();
	const NO_BIRD_COUNT = getNoBirdCount();
	const NO_BIRD_DELAY = getNoBirdDelay();

	hwangBot.sendMessage(chatId, `${NO_BIRD_MESSAGE}`, {
		reply_to_message_id: messageId
	});

	for (let i = 0; i < NO_BIRD_COUNT; i++) {
		hwangBot.sendMessage(chatId,
			`<a href="tg://user?id=${msg.from.id}">${NO_BIRD_MESSAGE}</a>`,
			{parse_mode: "HTML"}
		);
		await sleep(NO_BIRD_DELAY);
	}
});

hwangBot.on("polling_error", (err) => {
	logger.error(`bot polling_error : ${err}`)
});