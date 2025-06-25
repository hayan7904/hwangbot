require('dotenv').config();
const { hwangBot } = require('./init.js');
const { adminCheck } = require('./util/helper.js');
const { getNoBirdMessage, getNoBirdCount, setNoBirdMessage, setNoBirdCount } = require('./util/variables.js')
const { logger } = require('../winston/logger.js');

hwangBot.onText(/^\/status$/, (msg) => {
	if (!adminCheck(msg)) return;
	
	hwangBot.sendMessage(msg.chat.id, "Healthy");
})

hwangBot.onText(/^\/test(?:\s+(\S+))?$/, async (msg, match) => {
	if (!adminCheck(msg)) return;

	const arg = match[1] || null;

	if (arg) {
		const data = await getYoutubeData(arg, process.env.YOUTUBE_API_KEY);

		if (data && (data.title || data.description)) {
			const titleAndDescription = data.title + data.description;
			const answer = await callGptYoutube(titleAndDescription);

			hwangBot.sendMessage(msg.chat.id, `Test Result: ${answer}`);
		}
	} else {
		hwangBot.sendMessage(msg.chat.id, `Wrong args`);
	}
});

hwangBot.onText(/^\/msg(?:\s+"(.*)")?$/, (msg, match) => {
    if (!adminCheck(msg)) return;

    const arg = match[1] || null;

    if (arg && arg.trim()) {
		setNoBirdMessage(arg);
		hwangBot.sendMessage(msg.chat.id, `NO_BIRD_MESSAGE : ${arg}`);
		logger.info(`ADMIN | NO_BIRD_MESSAGE -> ${arg}`)
	} else {
		hwangBot.sendMessage(msg.chat.id, `NO_BIRD_MESSAGE : ${getNoBirdMessage()}`);
	}
})

hwangBot.onText(/^\/count(?:\s+(\d+))?$/, (msg, match) => {
    if (!adminCheck(msg)) return;

    const arg = parseInt(match[1]) || null;

    if (arg && arg > 0) {
		setNoBirdCount(arg);
		hwangBot.sendMessage(msg.chat.id, `NO_BIRD_COUNT : ${arg}`);
		logger.info(`ADMIN | NO_BIRD_COUNT -> ${arg}`)
	} else {
		hwangBot.sendMessage(msg.chat.id, `NO_BIRD_COUNT : ${getNoBirdCount()}`);
	}
})

hwangBot.setMyCommands(
	[
		{ command: "/status", description: "bot status" },
		{ command: "/test", description: "/test youtube_id" },
		{ command: "/msg", description: "/msg (?:\"string\")" },
		{ command: "/count", description: "/count (?:number)" },
	], 
	{ scope: { type: "chat", chat_id: 49819934} }
);