require('dotenv').config();
const OpenAIApi = require('openai');
const openAI = new OpenAIApi({
    apiKey: process.env.OPENAI_KEY
});

const callGptYoutube = async (msg) => {
	return openAI.chat.completions.create({
		model: 'gpt-4o-mini',
		messages: [
			{ role: 'system', content: "다음은 어떤 유튜브 동영상의 제목과 설명입니다. 해당 영상은 조류(새, bird) 관한 영상인가요? YES 또는 NO로 간결하게 대답해주세요."},
			{ role: 'user', content: msg },
		],
	}).then((res) => {
		return response.choices[0].message.content;
	}).catch((error) => {
		console.error('error: ', error);
		throw error;
	});
}

const callGptVision = (key, filePath) => {
	return openAI.chat.completions.create({
		model: "gpt-4o-mini",
		messages: [
			{
				role: "user",
				content: [
					{ type: "text", text: "해당 이미지는 조류(새, bird) 관한 이미지인가요? YES 또는 NO로 간결하게 대답해주세요." },
					{
						type: "image_url",
						image_url: {
							"url": `https://api.telegram.org/file/bot${key}/${filePath}`,
						},
					},
				],
			},
		],
	}).then((res) => {
		return response.choices[0].message.content;
	}).catch((err) => {
		console.error('error: ', err);
		throw err;
	});
}

module.exports = {
	callGptYoutube,
	callGptVision
}