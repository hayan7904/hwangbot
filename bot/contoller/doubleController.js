require('dotenv').config();
const hwangBot = require('@/init');
const { adminChatCheck } = require('@/util/commonHelper');
const { getDoubleCount, insertDoubleItem, getDoubleImageByUniqueId, deleteDoubleItemByUniqueId } = require('@/util/db/stickerDBUtil');
const { doubleInfo, makeDoubleCon } = require('@/util/doubleHelper');
const logger = require('@logger/logger');

hwangBot.onText(/^\/double(?:@hwangbot_bot)?$/, (msg) => {
    hwangBot.sendMessage(msg.chat.id, '<b>🖼 더블콘으로 만들 스티커 2개를 순서대로 보내주세요.</b>', {parse_mode: "HTML"});
    doubleInfo.start(msg.from.id, 'make');
});

hwangBot.onText(/^\/delete(?:@hwangbot_bot)?$/, (msg) => {
    if (!adminChatCheck(msg)) return;

    hwangBot.sendMessage(msg.chat.id, '<b>🖼 제거할 더블콘에 포함된 스티커를 보내주세요.</b>', {parse_mode: "HTML"});
    doubleInfo.start(msg.from.id, 'delete');
});

hwangBot.onText(/^\/cancel(?:@hwangbot_bot)?$/, (msg) => {
    if (!doubleInfo.isWorking(msg.from.id)) return;

    hwangBot.sendMessage(msg.chat.id, '<b>❎ 더블콘 제작이 취소되었습니다.</b>', {parse_mode: "HTML"});
    doubleInfo.complete(msg.from.id);
});

hwangBot.on('message', async (msg) => {
    if (!msg.sticker) return;

    const uniqueId = msg.sticker.file_unique_id;
    const userId = msg.from.id;

    if (doubleInfo.isWorking(msg.from.id)) {
        if (doubleInfo.isTypeOf(msg.from.id, 'make') && !doubleInfo.isReady(userId)) {
            if (getDoubleCount(uniqueId) > 0) {
                hwangBot.sendMessage(msg.chat.id, '<b>❌ 이미 더블콘이 존재합니다.</b>', {parse_mode: "HTML"});
                return;
            }
    
            const fileId = msg.sticker.file_id;
            const file = await hwangBot.getFile(fileId);
    
            doubleInfo.add(userId, uniqueId, file.file_path);
            hwangBot.sendMessage(msg.chat.id, '<b>✅ 더블콘 요청 완료</b>', {parse_mode: "HTML"});
            logger.info(`ADMIN | DOUBLECON | [${uniqueId}] Sticker Added`);
    
            if (doubleInfo.isReady(userId)) {
                const job = doubleInfo.get(userId);
    
                hwangBot.sendMessage(msg.chat.id, '<b>⚙ 더블콘 제작 시작</b>', {parse_mode: "HTML"});
                logger.info(`ADMIN | DOUBLECON | [${job.uniqueId[0]} | ${job.uniqueId[1]}] Doublecon Creation Start`);
    
                try {
                    const { res, ext } = await makeDoubleCon(userId);
                    const conTitle = await hwangBot.getStickerSet(msg.sticker.set_name).then(res => res.title);
    
                    if (res && insertDoubleItem([job.uniqueId[0], job.uniqueId[1], conTitle, msg.sticker.set_name, res, ext]).changes > 0) {
                        if (ext == 'webp') hwangBot.sendSticker(msg.chat.id, res);
                        else hwangBot.sendAnimation(msg.chat.id, res);
                        logger.info(`ADMIN | DOUBLECON | [${job.uniqueId[0]} | ${job.uniqueId[1]}] Doublecon Creation Success`);
                    } else {
                        throw new Error('Error while making doublecon');
                    }
                } catch (err) {
                    hwangBot.sendMessage(msg.chat.id, '<b>❌ 더블콘 제작 실패</b>', {parse_mode: "HTML"});
                    logger.error('Doublecon Creation Error');
                    logger.error(err.stack);
                } finally {
                    if (adminChatCheck(msg)) {
                        doubleInfo.continue(msg.from.id);
                    } else {
                        doubleInfo.complete(msg.from.id);
                    };
                }
            }
        } else if (doubleInfo.isTypeOf(msg.from.id, 'delete')) {
            if (getDoubleCount(uniqueId) == 0) {
                hwangBot.sendMessage(msg.chat.id, '<b>❌ 해당 스티커를 포함하는 더블콘이 없습니다.</b>', {parse_mode: "HTML"});
                return;
            }

            const item = getDoubleImageByUniqueId(uniqueId);
            const res = deleteDoubleItemByUniqueId(uniqueId);

            if (res?.changes > 0) {
                hwangBot.sendMessage(msg.chat.id, '<b>🗑 더블콘 삭제 완료</b>', {parse_mode: "HTML"});
                logger.info(`ADMIN | DOUBLECON | [${item.unique_id_1} | ${item.unique_id_1} | ${item.con_title} | ${item.pack_name}] Doublecon Deleted`);
            } else {
                hwangBot.sendMessage(msg.chat.id, '<b>❌ 더블콘 삭제 실패</b>', {parse_mode: "HTML"});
            }
        }
    } else if (getDoubleCount(uniqueId) > 0) {
        const { image, ext } = getDoubleImageByUniqueId(uniqueId);

        await hwangBot.deleteMessage(msg.chat.id, msg.message_id);

        if (ext == 'webp') {
            hwangBot.sendPhoto(msg.chat.id, image, {
                caption: `<b>${msg.from.last_name ? msg.from.last_name.concat(' ') : ''}${msg.from.first_name}</b>`,
                parse_mode: 'HTML'
            });
        } else {
            hwangBot.sendAnimation(msg.chat.id, image, {
                caption: `<b>${msg.from.last_name ? msg.from.last_name.concat(' ') : ''}${msg.from.first_name}</b>`,
                parse_mode: 'HTML'
            });
        }
    }
});