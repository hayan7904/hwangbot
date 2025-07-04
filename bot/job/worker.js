require('dotenv').config();
const fs = require('fs');
const crypto = require('crypto');
const hwangBot = require('@/init');
const { getOldestQueueItem, deleteQueueItem, insertPackageItem } = require('@util/db/stickerDBUtil');
const { workInfo, LINK_DCCON, LINK_STICKER, getLink, getConData, downloadCon, convertCon } = require('@util/stickerHelper');
const logger = require ('@logger/logger');

setInterval(async () => {
    if (workInfo.isWorking()) return;

    const job = await getOldestQueueItem();

    if (!job) return;

    const { id, chat_id, user_id, user_name, con_id, con_title, con_length } = job;

    hwangBot.sendMessage(chat_id, 
        `<b>⚙️ [<a href='${getLink(LINK_DCCON, con_id)}'>${con_id}</a>] <code>${con_title}</code> 제작 시작</b>`,
        {parse_mode: "HTML"}
    );
    logger.info(`ADMIN | STICKER | [${con_id} | ${con_title}] Stickerpack Creation Start`);

    try {
        workInfo.start(job);

        const conData = await getConData(con_id); // cid, title, imagePath
        logger.info(`ADMIN | STICKER | [${con_id} | ${con_title}] STAGE 1 -> Fetch Complete`);

        workInfo.setState('⬇️ 이미지 다운로드 중');
        const downloadResult = await downloadCon(conData);
        logger.info(`ADMIN | STICKER | [${con_id} | ${con_title}] STAGE 2 -> Download Complete`);
        
        workInfo.setState('🔄 이미지 변환 중');
        const convertResult = await convertCon(downloadResult);
        logger.info(`ADMIN | STICKER | [${con_id} | ${con_title}] STAGE 3 -> Convert Complete`);

        workInfo.setState('📦 스티커팩 제작 중');
        const mainSticker = convertResult.shift();
        const botName = await hwangBot.getMe().then(me => me.username);
        let packName, packFullName;

        let creationCheck = false;
        for (let i = 0; i < 5; i++) {
            packName = crypto.randomBytes(8).toString('base64url').replace(/[^a-zA-Z0-9]/g, '');
            while (!isNaN(packName.charAt(0))) packName = crypto.randomBytes(8).toString('base64url').replace(/[^a-zA-Z0-9]/g, '');
            packFullName = packName + '_by_' + botName;

            logger.info(`ADMIN | STICKER | [${con_id} | ${con_title}] STAGE 4 -> Packname: ${packFullName}`);

            mainStickerStream = fs.createReadStream(mainSticker.filepath, { highWaterMark: 64 * 1024 });

            creationCheck = await hwangBot.createNewStickerSet(
                process.env.CHAT_ID_ADMIN,
                packFullName,
                conData.title,
                mainStickerStream,
                '🍞'
            );

            if (creationCheck) {
                workInfo.progress();
                logger.info(`ADMIN | STICKER | [${con_id} | ${con_title}] STAGE 4 -> Stickerpack Creation Success`);
                break;
            }

            logger.error(`ADMIN | STICKER | [${con_id} | ${con_title}] STAGE 4 -> Stickerpack Creation Failed (${i}/5)`);
        }

        if (!creationCheck) {
            throw new Error('Stickerpack creation failed');
        }

        for (const { filepath, ext } of convertResult) {
            stickerStream = fs.createReadStream(filepath, { highWaterMark: 64 * 1024 });

            await hwangBot.addStickerToSet(
                process.env.CHAT_ID_ADMIN,
                packFullName,
                stickerStream,
                '🍞',
                ext == 'webm' ? 'webm_sticker' : 'png_sticker',
            );
            workInfo.progress();
        }

        insertPackageItem([con_id, con_title, packFullName]);
        await deleteQueueItem(id);

        hwangBot.sendMessage(chat_id, 
            `<b>✅ [<a href='${getLink(LINK_STICKER, packFullName)}'>${con_id}</a>] <code>${con_title}</code> 제작에 성공했습니다.</b>`,
            {parse_mode: "HTML"}
        );
        logger.info(`ADMIN | STICKER | [${con_id} | ${con_title}] Stickerpack Creation Complete`);
    } catch (err) {
        hwangBot.sendMessage(chat_id,
            `<b>❌ [<a href='${getLink(LINK_DCCON, con_id)}'>${con_id}</a>] <code>${con_title}</code> 제작에 실패했습니다.</b>`,
            {parse_mode: "HTML"}
        );
        logger.error(err.stack);
    } finally {
        workInfo.complete();
    }
}, process.env.WORKER_INTERVAL);