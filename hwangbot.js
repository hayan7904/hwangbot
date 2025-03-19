import { callGptYoutube, callGptVision } from './util/gptUtil';
import { getYoutubeId, getYoutubeData } from './util/youtubeUtil';

require('dotenv').config();
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

telegramBot.on('message', async (msg) => {

	// only msgs from our chat
	if (msg.chat.id != 49819934) return;

	console.log(msg.from.id + ', ' + msg.from.first_name + ', ' + msg.from.last_name + ', ' + msg.from.username);

	// let answer = null;

	// if (msg.photo) {
	// 	const fileIdx = Math.max(msg.photo.length - 2, 0);
	// 	const fileId = msg.photo[fileIdx].file_id;
	// 	const file = await telegramBot.getFile(fileId);

	// 	console.log('File Path: ', file.file_path);

	// 	answer = await callGptVision(process.env.TELEGRAM_BOT_KEY, file.file_path);
	// } else if (msg.entities) {
	// 	let myUrl = null;

	// 	for (let i in msg.entities) {
	// 		if ((msg.entities[i].type == 'url' && msg.text.indexOf('youtu') !== -1)) {
	// 			myUrl = msg.text;
	// 			break;
	// 		} else if (msg.entities[i].type == 'text_link' && msg.entities[i].url.indexOf("youtu") !== -1) {
	// 			myUrl = msg.entities[i].url;
	// 			break;
	// 		}
	// 	}

	// 	if (myUrl != null) {
	// 		let id = getYoutubeId(myUrl);

	// 		if (id != null) {
	// 			const data = await getYoutubeData(id, process.env.YOUTUBE_API_KEY);

	// 			//console.log('#### Youtube Data ####');
	// 			//console.log(data);

	// 			const titleAndDescription = data.title + data.description;
	// 			answer = await callGptYoutube(titleAndDescription);
	// 		}
	// 	}
	// }

	// if (answer != null && answer == 'YES') {
	// 	const chatId = msg.chat.id;
	// 	const messageId = msg.message_id;

	// 	const birdTime = getDate(msg.date);
	// 	console.log(`[${msg.chat.id}:${msg.message_id}] Bird detected... by ${msg.from.first_name} at ${birdTime.year}-${birdTime.month}-${birdTime.day} ${birdTime.hour}:${birdTime.minute}`);

	// 	for (let i = 0; i < 10; i++) {
	// 		telegramBot.sendMessage(chatId, '조류 그만!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!', {
	// 			reply_to_message_id: messageId
	// 		});
	// 		await sleep(500);
	// 	}
	// }

});

telegramBot.on("polling_error", console.log);