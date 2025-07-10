require('dotenv').config();
const hwangBot = require('@/init');
const { adminChatCheck } = require('@/util/commonHelper');
const { getDoubleCount, insertDoubleItem, getDoubleImageByUniqueId, getPackageItemByPackName } = require('@/util/db/stickerDBUtil');
const { doubleInfo, makeDoubleCon } = require('@/util/doubleHelper');
const logger = require('@logger/logger');

hwangBot.onText(/^\/double(?:@hwangbot_bot)?$/, (msg) => {
    hwangBot.sendMessage(msg.chat.id, '<b>🖼 더블콘으로 만들 스티커 2개를 순서대로 보내주세요.</b>', {parse_mode: "HTML"});
    doubleInfo.start(msg.from.id);
});

hwangBot.onText(/^\/cancel(?:@hwangbot_bot)?$/, (msg) => {
    if (!doubleInfo.isWorking(msg.from.id)) return;

    hwangBot.sendMessage(msg.chat.id, '<b>❎ 더블콘 제작이 취소되었습니다.</b>', {parse_mode: "HTML"});
    doubleInfo.complete(msg.from.id);
});

hwangBot.on('message', async (msg) => {
    if (!msg.sticker) return;

    const uniqueId = msg.sticker.file_unique_id;

    if (doubleInfo.isWorking(msg.from.id)) {
        if (getDoubleCount(uniqueId) > 0) {
            hwangBot.sendMessage(msg.chat.id, '<b>❌ 이미 더블콘이 존재합니다.</b>', {parse_mode: "HTML"});
            return;
        }

        const userId = msg.from.id;
        const fileId = msg.sticker.file_id;
        const file = await hwangBot.getFile(fileId);

        doubleInfo.add(userId, uniqueId, file.file_path);
        hwangBot.sendMessage(msg.chat.id, '<b>✅ 더블콘 요청 완료</b>', {parse_mode: "HTML"});
        logger.info(`ADMIN | DOUBLECON | ${uniqueId} | Sticker Added`);

        if (doubleInfo.isReady(userId)) {
            const job = doubleInfo.get(userId);

            hwangBot.sendMessage(msg.chat.id, '<b>⚙ 더블콘 제작 시작</b>', {parse_mode: "HTML"});
            logger.info(`ADMIN | DOUBLECON | ${job.uniqueId[0]} & ${job.uniqueId[1]} | Doublecon Creation Start`);

            try {
                const { res, ext } = await makeDoubleCon(userId);
                const conTitle = await hwangBot.getStickerSet(msg.sticker.set_name).then(res => res.title);

                if (res && insertDoubleItem([job.uniqueId[0], job.uniqueId[1], conTitle, msg.sticker.set_name, res, ext]).changes > 0) {
                    if (ext == 'webp') hwangBot.sendSticker(msg.chat.id, res);
                    else hwangBot.sendAnimation(msg.chat.id, res);
                    logger.info(`ADMIN | DOUBLECON | ${job.uniqueId[0]} & ${job.uniqueId[1]} | Doublecon Creation Success`);
                } else {
                    throw new Error('Error while making doublecon');
                }
            } catch (err) {
                hwangBot.sendMessage(msg.chat.id, '<b>❌ 더블콘 제작 실패</b>', {parse_mode: "HTML"});
                logger.error('Doublecon Creation Error');
                logger.error(err.stack);
            } finally {
                doubleInfo.complete(msg.from.id);
            }
        }
    } else if (getDoubleCount(uniqueId) > 0) {
        const { image, ext } = getDoubleImageByUniqueId(uniqueId);

        await hwangBot.deleteMessage(msg.chat.id, msg.message_id)
        if (ext == 'webp') hwangBot.sendSticker(msg.chat.id, image);
        else hwangBot.sendAnimation(msg.chat.id, image);
    }
});