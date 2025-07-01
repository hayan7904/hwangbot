const TelegramBotApi = require('node-telegram-bot-api');
const hwangBot = new TelegramBotApi(
    process.env.TELEGRAM_BOT_KEY,
    {polling: true}
);

module.exports = {
	hwangBot
}