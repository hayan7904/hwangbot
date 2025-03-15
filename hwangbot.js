require('dotenv').config();

const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const OpenAIApi = require('openai');

const token = process.env.TELEGRAM_BOT_KEY;
const openAI = new OpenAIApi({
	apiKey: process.env.OPENAI_KEY
});

const callGpt = async function(msg) {
	try { 
		const response = await openAI.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{ role: 'system', content: "다음은 어떤 유튜브 동영상의 제목과 설명입니다. 해당 영상은 조류(새, bird) 관한 영상인가요? YES 또는 NO로 간결하게 대답해주세요."},
				{ role: 'user', content: msg },
			],
		});

		const answer = response.choices[0].message.content;

		return answer;
	} catch (error) {
		console.error('error: ', error);
		throw error;
	}
};

const callGptVision = async function(filePath) {
	try {
		const response = await openAI.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [
				{
					role: "user",
					content: [
						{ type: "text", text: "해당 이미지는 조류(새, bird) 관한 이미지인가요? YES 또는 NO로 간결하게 대답해주세요." },
						{
							type: "image_url",
							image_url: {
								"url": `https://api.telegram.org/file/bot${token}/${filePath}`,
							},
						},
					],
				},
			],
		});

		const answer = response.choices[0].message.content;

		return answer;
	} catch (error) {
		console.error('error: ', error);
		throw error;
	}
}

const getYoutubeData = async function(id) {
	try {
		const res = await axios.get(`https://www.googleapis.com/youtube/v3/videos?id=${id}&key=${process.env.YOUTUBE_API_KEY}&part=snippet`);
		return res.data.items[0]?.snippet;
	} catch (err) {
		console.error(err);
	}
};

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
 
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

bot.on('message', async (msg) => {

	if (msg.from.username !== 'hse4770' && msg.from.first_name !== '대환' && msg.chat.id != 49819934) return;

	let answer = null;

	if (msg.photo) {
		const fileIdx = Math.max(msg.photo.length - 2, 0);
		const fileId = msg.photo[fileIdx].file_id;
		const file = await bot.getFile(fileId);
		console.log('File Path: ', file.file_path);
		answer = await callGptVision(file.file_path);
	} else if (msg.entities) {
		let myUrl = null;

		for (let i in msg.entities) {
			if ((msg.entities[i].type == 'url' && msg.text.indexOf('youtu') !== -1)) {
				myUrl = msg.text;
				//answer = await callGpt(msg.text);
				break;
			} else if (msg.entities[i].type == 'text_link' && msg.entities[i].url.indexOf("youtu") !== -1) {
				myUrl = msg.entities[i].url;
				//answer = await callGpt(msg.entities[i].url);
				break;
			}
		}

		if (myUrl != null) {
			let id = null;
			
			if (myUrl.indexOf('/shorts/') !== -1) {
				id = myUrl.substring(myUrl.indexOf('/shorts/') + 8);
			} else if (myUrl.indexOf('/watch?v=') !== -1) {
				id = myUrl.substring(myUrl.indexOf('/watch?v=') + 9);
			} else if (myUrl.indexOf('.be/') !== -1) {
				id = myUrl.substring(myUrl.indexOf('.be/') + 4);
			}

			if (id.indexOf('?') !== -1) {
				id = id.substring(0, id.indexOf('?'));
			}

			console.log('Youtube ID: ', id);

			if (id != null) {
				const data = await getYoutubeData(id);
				//console.log('#### Youtube Data ####');
				//console.log(data);
				const titleAndDescription = data.title + data.description;
				answer = await callGpt(titleAndDescription);
			}
		}
	}

	if (answer != null && answer == 'YES') {
		const chatId = msg.chat.id;
		const messageId = msg.message_id;

		const birdTime = getDate(msg.date);
		console.log(`[${msg.chat.id}:${msg.message_id}] Bird detected... by ${msg.from.first_name} at ${birdTime.year}-${birdTime.month}-${birdTime.day} ${birdTime.hour}:${birdTime.minute}`);

		for (let i = 0; i < 10; i++) {
			bot.sendMessage(chatId, '조류 그만!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!', {
				reply_to_message_id: messageId
			});
			await sleep(500);
		}
	}

});

bot.on("polling_error", console.log);