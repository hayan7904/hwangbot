require('dotenv').config();
const { hwangBot } = require('./init.js');
const { adminCheck } = require('./util/helper.js');
const VARS = require('./util/variables.js')

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

hwangBot.onText(/^\/getCount$/, (msg, match) => {
    if (!adminCheck(msg)) return;

    hwangBot.sendMessage(msg.chat.id, `NO_BIRD_COUNT : ${VARS.NO_BIRD_COUNT}`);
})

hwangBot.onText(/^\/setCount(?:\s+(\d+))?$/, (msg, match) => {
    if (!adminCheck(msg)) return;

    const arg = parseInt(match[1]) || null;

    if (!arg || arg <= 0) return;

    VARS.NO_BIRD_COUNT = arg;
    hwangBot.sendMessage(msg.chat.id, `NO_BIRD_COUNT : ${VARS.NO_BIRD_COUNT}`);
})

hwangBot.setMyCommands(
	[
		{ command: "/status", description: "bot status" },
		{ command: "/test", description: "/test youtube_id" },
	], 
	{ scope: { type: "chat", chat_id: 49819934} }
);