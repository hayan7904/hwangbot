require('dotenv').config();
const { hwangBot } = require('@/init.js');
const { callGptYoutube, callGptVision } = require('@util/gptUtil.js');
const { getYoutubeId, getYoutubeData } = require('@util/youtubeUtil.js');
const { getBlacklist } = require('@util/db/commonDBUtil.js');
const { logger } = require('@logger/logger.js');

const sleep = (ms) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

const getDate = (unixTime) => {
	const realTime = new Date(unixTime * 1000);
	return {
		year: realTime.getFullYear(),
		month: realTime.getMonth() + 1,
		day: realTime.getDate(),
		hour: realTime.getHours(),
		minute: realTime.getMinutes(),
	};
}

const commonCheck = (msg) => msg.chat.id == process.env.CHAT_ID_COMMON
const blackCheck = (msg) => getBlacklist().includes(msg.from.id)
const commonBlackCheck = (msg) => commonCheck(msg) && blackCheck(msg)
const adminUserCheck = (msg) => msg.from.id == process.env.CHAT_ID_ADMIN;
const adminChatCheck = (msg) => msg.chat.id == process.env.CHAT_ID_ADMIN;

const killBird = async (msg) => {
	let ans = null;

	if (msg.photo) {
		const fileIdx = Math.max(msg.photo.length - 2, 0);
		const fileId = msg.photo[fileIdx].file_id;
		const file = await hwangBot.getFile(fileId).catch(err => { logger.error(err.stack); });

		if (file) ans = await callGptVision(process.env.TELEGRAM_BOT_KEY, file.file_path);
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

		if (myUrl) {
			const id = getYoutubeId(myUrl);

			if (id) {
				const data = await getYoutubeData(id, process.env.YOUTUBE_API_KEY);

				if (data && (data.title || data.description)) {
					const titleAndDescription = data.title + data.description;
					ans = await callGptYoutube(titleAndDescription);
				}
			}
		}
	}

	return ans;
}

module.exports = {
    sleep,
    getDate,
	commonCheck,
	blackCheck,
	commonBlackCheck,
	adminUserCheck,
	adminChatCheck,
	killBird,
}