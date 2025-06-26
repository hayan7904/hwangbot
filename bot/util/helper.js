require('dotenv').config();
const { hwangBot } = require('../init.js');
const { callGptYoutube, callGptVision } = require('./gptUtil.js');
const { getYoutubeId, getYoutubeData } = require('./youtubeUtil.js');
const { getBlacklist } = require('./commonDBUtil.js');
const { logger } = require('../../winston/logger.js');

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
const commonBlackCheck = (msg) => commonCheck(msg) && getBlacklist().includes(msg.from.id)
const adminCheck = (msg) => msg.chat.id == process.env.CHAT_ID_ADMIN;

const killBird = async (msg) => {
	if (msg.photo) {
		const fileIdx = Math.max(msg.photo.length - 2, 0);
		const fileId = msg.photo[fileIdx].file_id;
		const file = await hwangBot.getFile(fileId);

		logger.http(`File Path: ${file.file_path}`);
		
		return callGptVision(process.env.TELEGRAM_BOT_KEY, file.file_path);
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
				const data = getYoutubeData(id, process.env.YOUTUBE_API_KEY);

				if (data && (data.title || data.description)) {
					const titleAndDescription = data.title + data.description;
					return callGptYoutube(titleAndDescription);
				}
			}
		}
	}

	return null;
}

module.exports = {
    sleep,
    getDate,
	commonBlackCheck,
	adminCheck,
	killBird,
}