require('dotenv').config();
const { hwangBot } = require('./init.js');
const { adminCheck } = require('./util/helper.js');
const { callGptYoutube, callGptVision } = require('./util/gptUtil.js');
const { getYoutubeId, getYoutubeData } = require('./util/youtubeUtil.js');
const {
	getNoBirdMessage, getNoBirdCount, getNoBirdDelay, getBlacklist,
	setNoBirdMessage, setNoBirdCount, setNoBirdDelay,
	insertBlacklist, deleteBlacklist,
} = require('./util/commonDBUtil.js')
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
		hwangBot.sendMessage(msg.chat.id, `NO_BIRD_MESSAGE -> ${arg}`);
		logger.info(`ADMIN | NO_BIRD_MESSAGE -> ${arg}`);
	} else {
		hwangBot.sendMessage(msg.chat.id, `NO_BIRD_MESSAGE : ${getNoBirdMessage()}`);
	}
});

hwangBot.onText(/^\/count(?:\s+(\d+))?$/, (msg, match) => {
    if (!adminCheck(msg)) return;

    const arg = parseInt(match[1]) || null;

    if (arg && arg > 0) {
		setNoBirdCount(arg);
		hwangBot.sendMessage(msg.chat.id, `NO_BIRD_COUNT -> ${arg}`);
		logger.info(`ADMIN | NO_BIRD_COUNT -> ${arg}`)
	} else {
		hwangBot.sendMessage(msg.chat.id, `NO_BIRD_COUNT : ${getNoBirdCount()}`);
	}
});

hwangBot.onText(/^\/delay(?:\s+(\d+))?$/, (msg, match) => {
    if (!adminCheck(msg)) return;

    const arg = parseInt(match[1]) || null;

    if (arg && arg > 0) {
		setNoBirdDelay(arg);
		hwangBot.sendMessage(msg.chat.id, `NO_BIRD_DELAY -> ${arg}`);
		logger.info(`ADMIN | NO_BIRD_DELAY -> ${arg}`);
	} else {
		hwangBot.sendMessage(msg.chat.id, `NO_BIRD_DELAY : ${getNoBirdDelay()}`);
	}
});

hwangBot.onText(/^\/black(?:\s+(add|del)\s+(\d+))?$/, (msg, match) => {
    if (!adminCheck(msg)) return;

    const op = match[1] || null;

    if (op && ['add', 'del'].includes(op)) {
		const id = parseInt(match[2]);
		const blacklist = getBlacklist();
		const res = null;
		
		if (op == 'add') {
			if (!blacklist.includes(id)) {
				res = insertBlacklist(id);
			} else {
				hwangBot.sendMessage(msg.chat.id, `BLACKLIST -> ${op.toUpperCase()}: 이미 존재하는 id입니다.`);
				return;
			}
		} else if (op == 'del') {
			if (blacklist.includes(id)) {
				res = deleteBlacklist(id);
			} else {
				hwangBot.sendMessage(msg.chat.id, `BLACKLIST -> ${op.toUpperCase()}: 존재하지 않는 id입니다.`);
				return;
			}
		}

		if (res?.changes > 0) {
			hwangBot.sendMessage(msg.chat.id, `BLACKLIST -> ${op.toUpperCase()}: ${id}`);
			logger.info(`ADMIN | BLACKLIST -> ${op.toUpperCase()}: ${id}`);
		} else {
			hwangBot.sendMessage(msg.chat.id, `BLACKLIST -> ${op.toUpperCase()}: 실패`);
			logger.info(`ADMIN | BLACKLIST -> ${op.toUpperCase()}: 실패`);
		}
	} else {
		hwangBot.sendMessage(msg.chat.id, `BLACKLIST : ${getBlacklist()}`);
	}
});

hwangBot.setMyCommands(
	[
		{ command: "/status", description: "bot status" },
		{ command: "/test", description: "/test youtube_id" },
		{ command: "/msg", description: "/msg (?:\"string\")" },
		{ command: "/count", description: "/count (?:number)" },
		{ command: "/delay", description: "/delay (?:number)" },
		{ command: "/black", description: "/black (?:(add|del) number)" },
	], 
	{ scope: { type: "chat", chat_id: process.env.CHAT_ID_ADMIN} }
);