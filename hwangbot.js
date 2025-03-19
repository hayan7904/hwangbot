require('dotenv').config();
const { callGptYoutube, callGptVision } = require('./util/gptUtil.js');
const { getYoutubeId, getYoutubeData } = require('./util/youtubeUtil.js');

const TelegramBotApi = require('node-telegram-bot-api');
const telegramBot = new TelegramBotApi(
	process.env.TELEGRAM_BOT_KEY,
	{polling: true}
);

const sleep = function(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

const getDate = function(unixTime) {
	const realTime = new Date(unixTime * 1000);
	return {
		year: realTime.getFullYear(),
		month: realTime.getMonth() + 1,
		day: realTime.getDate(),
		hour: realTime.getHours(),
		minute: realTime.getMinutes(),
	};
}

const killBird = async function(msg) {
	let answer = null;

	if (msg.photo) {
		const fileIdx = Math.max(msg.photo.length - 2, 0);
		const fileId = msg.photo[fileIdx].file_id;
		const file = await telegramBot.getFile(fileId);

		console.log('File Path: ', file.file_path);

		answer = await callGptVision(process.env.TELEGRAM_BOT_KEY, file.file_path);
	} else if (msg.entities) {
		let myUrl = null;

		for (let i in msg.entities) {
			if ((msg.entities[i].type == 'url' && msg.text.indexOf('youtu') !== -1)) {
				myUrl = msg.text;
				break;
			} else if (msg.entities[i].type == 'text_link' && msg.entities[i].url.indexOf("youtu") !== -1) {
				myUrl = msg.entities[i].url;
				break;
			}
		}

		if (myUrl != null) {
			let id = getYoutubeId(myUrl);

			if (id != null) {
				const data = await getYoutubeData(id, process.env.YOUTUBE_API_KEY);

				if (data && (data.title || data.description)) {
					const titleAndDescription = data.title + data.description;
					answer = await callGptYoutube(titleAndDescription);
				}
			}
		}
	}

	if (answer != null && answer == 'YES') {
		const chatId = msg.chat.id;
		const messageId = msg.message_id;

		const birdTime = getDate(msg.date);
		console.log(`[${msg.chat.id}:${msg.message_id}] Bird detected... by ${msg.from.first_name} at ${birdTime.year}-${birdTime.month}-${birdTime.day} ${birdTime.hour}:${birdTime.minute}`);

		telegramBot.sendMessage(chatId, '조류 그만!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!', {
			reply_to_message_id: messageId
		});
		for (let i = 0; i < 15; i++) {
			telegramBot.sendMessage(
				chatId, 
				`<a href="tg://user?id=${msg.from.id}">조류 그만!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!</a>`,
				{ parse_mode: "HTML" }
			);
			await sleep(700);
		}
	}
}

telegramBot.on('message', async (msg) => {
	if (msg.chat.id == process.env.CHAT_ID_COMMON) {
		if (msg.from.id == 52186264 || msg.from.id == 56796388) killBird(msg);
		return;
	}
});

telegramBot.onText(/^\/status$/, (msg) => {
	if (msg.chat.id != process.env.CHAT_ID_ADMIN) return;
	
	telegramBot.sendMessage(msg.chat.id, "Healthy");
})

telegramBot.onText(/^\/test(?:\s+(\S+))?$/, async (msg, match) => {
	if (msg.chat.id != process.env.CHAT_ID_ADMIN) return;

	const arg = match[1] || null;

	if (arg) {
		const data = await getYoutubeData(arg, process.env.YOUTUBE_API_KEY);

		if (data && (data.title || data.description)) {
			const titleAndDescription = data.title + data.description;
			const answer = await callGptYoutube(titleAndDescription);

			telegramBot.sendMessage(msg.chat.id, `Test Result: ${answer}`);
			telegramBot.sendMessage(
				msg.chat.id, 
				`<a href="tg://user?id=${msg.from.id}">조류 그만!!!!!!!!!!!!!!!!!!!!!</a>`,
				{ parse_mode: "HTML" }
			);
		}
	} else {
		telegramBot.sendMessage(msg.chat.id, `Wrong args`);
	}
});

telegramBot.setMyCommands(
	[
		{ command: "/status", description: "get status" },
		{ command: "/test", description: "test youtube id" },
	], 
	{ scope: { type: "chat", chat_id: 49819934} }
);

telegramBot.on("polling_error", console.log);