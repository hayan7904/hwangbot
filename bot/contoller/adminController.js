require('dotenv').config();
const { hwangBot } = require('@/init.js');
const { adminChatCheck } = require('@util/commonHelper.js');
const { callGptYoutube, callGptVision } = require('@util/gptUtil.js');
const { getYoutubeId, getYoutubeData } = require('@util/youtubeUtil.js');
const {
	getNoBirdMessage, getNoBirdCount, getNoBirdDelay, getBlacklist,
	setNoBirdMessage, setNoBirdCount, setNoBirdDelay,
	insertBlacklist, deleteBlacklist,
} = require('@util/db/commonDBUtil.js')
const { logger } = require('@logger/logger.js');

hwangBot.onText(/^\/status$/, (msg) => {
	if (!adminChatCheck(msg)) return;
	
	hwangBot.sendMessage(msg.chat.id, `<b>✔ Healthy</b>`, {parse_mode: "HTML"});
})

hwangBot.onText(/^\/test(?:\s+(\S+))?$/, async (msg, match) => {
	if (!adminChatCheck(msg)) return;

	const arg = match[1] || null;

	if (arg) {
		const data = await getYoutubeData(arg, process.env.YOUTUBE_API_KEY);

		if (data && (data.title || data.description)) {
			const titleAndDescription = data.title + data.description;
			const ans = await callGptYoutube(titleAndDescription);

			hwangBot.sendMessage(msg.chat.id, `<b>📄 Test Result:</b> <i>${ans}</i>`, {parse_mode: "HTML"});
		}
	} else {
		hwangBot.sendMessage(msg.chat.id, `<b>❌ Wrong arg</b>`, {parse_mode: "HTML"});
	}
});

hwangBot.onText(/^\/msg(?:\s+"(.*)")?$/, (msg, match) => {
    if (!adminChatCheck(msg)) return;

    const arg = match[1] || null;

    if (arg && arg.trim()) {
		setNoBirdMessage(arg);
		hwangBot.sendMessage(msg.chat.id, `<b>📋 NO_BIRD_MESSAGE:</b> <i>${arg}</i>`, {parse_mode: "HTML"});
		logger.info(`ADMIN | NO_BIRD_MESSAGE -> ${arg}`);
	} else {
		hwangBot.sendMessage(msg.chat.id, `<b>📋 NO_BIRD_MESSAGE:</b> <i>${getNoBirdMessage()}</i>`, {parse_mode: "HTML"});
	}
});

hwangBot.onText(/^\/count(?:\s+(\d+))?$/, (msg, match) => {
    if (!adminChatCheck(msg)) return;

    const arg = parseInt(match[1]) || null;

    if (arg && arg > 0) {
		setNoBirdCount(arg);
		hwangBot.sendMessage(msg.chat.id, `<b>📋 NO_BIRD_COUNT:</b> <i>${arg}</i>`, {parse_mode: "HTML"});
		logger.info(`ADMIN | NO_BIRD_COUNT -> ${arg}`)
	} else {
		hwangBot.sendMessage(msg.chat.id, `<b>📋 NO_BIRD_COUNT:</b> <i>${getNoBirdCount()}</i>`, {parse_mode: "HTML"});
	}
});

hwangBot.onText(/^\/delay(?:\s+(\d+))?$/, (msg, match) => {
    if (!adminChatCheck(msg)) return;

    const arg = parseInt(match[1]) || null;

    if (arg && arg > 0) {
		setNoBirdDelay(arg);
		hwangBot.sendMessage(msg.chat.id, `<b>📋 NO_BIRD_DELAY:</b> <i>${arg}</i>`, {parse_mode: "HTML"});
		logger.info(`ADMIN | NO_BIRD_DELAY -> ${arg}`);
	} else {
		hwangBot.sendMessage(msg.chat.id, `<b>📋 NO_BIRD_DELAY:</b> <i>${getNoBirdDelay()}</i>`, {parse_mode: "HTML"});
	}
});

hwangBot.onText(/^\/black(?:\s+(add|del)\s+(\d+))?$/, (msg, match) => {
    if (!adminChatCheck(msg)) return;

    const op = match[1] || null;

    if (op && ['add', 'del'].includes(op)) {
		const id = parseInt(match[2]);
		const blacklist = getBlacklist();
		const res = null;
		
		if (op == 'add') {
			if (!blacklist.includes(id)) {
				res = insertBlacklist(id);
			} else {
				hwangBot.sendMessage(msg.chat.id, `<b>❌ BLACKLIST:</b> 이미 존재하는 ID입니다.`, {parse_mode: "HTML"});
				return;
			}
		} else if (op == 'del') {
			if (blacklist.includes(id)) {
				res = deleteBlacklist(id);
			} else {
				hwangBot.sendMessage(msg.chat.id, `<b>❌ BLACKLIST:</b> 존재하지 않는 ID입니다.`, {parse_mode: "HTML"});
				return;
			}
		}

		if (res?.changes > 0) {
			hwangBot.sendMessage(msg.chat.id, `<b>✅ BLACKLIST ${op.toUpperCase()}:</b> <i>${id}</i>`, {parse_mode: "HTML"});
			logger.info(`ADMIN | BLACKLIST -> ${op.toUpperCase()}: ${id}`);
		} else {
			hwangBot.sendMessage(msg.chat.id, `<b>❌ BLACKLIST ${op.toUpperCase()}: <i>Faild</i>`, {parse_mode: "HTML"});
			logger.info(`ADMIN | BLACKLIST -> ${op.toUpperCase()}: 실패`);
		}
	} else {
		const list = getBlacklist().join('\n');
		hwangBot.sendMessage(msg.chat.id, `<b>📋 BLACKLIST:</b>\n\n${list}`, {parse_mode: "HTML"});
	}
});

hwangBot.onText(/^\/sticker$/, (msg) => {
    if (!adminChatCheck(msg)) return;

	hwangBot.sendMessage(msg.chat.id,
		`
			<b>📝 스티커 명령어 목록:</b>\n\n
			<code>/sticker queue</code>\n
			<code>/sticker queue clear</code>\n
			<code>/sticker list </code>\n
			<code>/sticker create </code>\n
			<code>/sticker permit </code>\n
			<code>/sticker delete </code>\n
		`, {parse_mode: "HTML"}
	);
});

hwangBot.setMyCommands(
	[
		{ command: "/status", description: "bot status" },
		{ command: "/test", description: "/test youtube_id" },
		{ command: "/msg", description: "/msg (?:\"string\")" },
		{ command: "/count", description: "/count (?:number)" },
		{ command: "/delay", description: "/delay (?:number)" },
		{ command: "/black", description: "/black (?:(add|del) number)" },
		{ command: "/sticker", description: "list sticker commands" },
	], 
	{ scope: { type: "chat", chat_id: process.env.CHAT_ID_ADMIN} }
);