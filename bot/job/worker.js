require('dotenv').config();
const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const fs = require('fs');
const crypto = require('crypto');
const hwangBot = require('@/init');
const { sleep } = require('@util/commonHelper');
const { jobsInfo, LINK_DCCON, LINK_STICKER, getLink, getConData, downloadCon, convertCon } = require('@util/stickerHelper');
const { insertPackageItem } = require('@util/db/stickerDBUtil');
const logger = require('@logger/logger');
const redisClient = require('@util/db/redis') ;

const worker = new Worker(
    'stickerQueue',
    async (job) => {
        const { chatId, userId, userName, conId, conTitle, conLength } = job.data;
        let mainStickerStream, stickerStream;

        try {
            // TODO : Make stickerpack
            hwangBot.sendMessage(chatId, 
                `<b>⚙️ [<a href='${getLink(LINK_DCCON, conId)}'>${conId}</a>] <code>${conTitle}</code> 제작 시작</b>`,
                {parse_mode: "HTML"}
            );

            jobsInfo.start(job.id, job.data);
            // await sleep(60000);

            const conData = await getConData(conId); // cid, title, imagePath
            logger.info(`ADMIN | STICKER | [${conId} | ${conTitle}] STAGE 1 -> Fetch Complete`);

            jobsInfo.setState(job.id, '⬇️ 이미지 다운로드 중', conLength);
            const downloadResult = await downloadCon(conData, job.id);
            hwangBot.sendMessage(chatId, 
                `<b>✅ [<a href='${getLink(LINK_DCCON, conId)}'>${conId}</a>] <code>${conTitle}</code> 이미지 다운로드 완료</b>`,
                {parse_mode: "HTML"}
            );
            logger.info(`ADMIN | STICKER | [${conId} | ${conTitle}] STAGE 2 -> Download Complete`);
            
            jobsInfo.setState(job.id, '🔄 이미지 변환 중');
            const convertResult = await convertCon(downloadResult, job.id);
            hwangBot.sendMessage(chatId, 
                `<b>✅ [<a href='${getLink(LINK_DCCON, conId)}'>${conId}</a>] <code>${conTitle}</code> 이미지 변환 완료</b>`,
                {parse_mode: "HTML"}
            );
            logger.info(`ADMIN | STICKER | [${conId} | ${conTitle}] STAGE 3 -> Convert Complete`);

            jobsInfo.setState(job.id, '📦 스티커팩 제작 중');
            const mainSticker = convertResult.shift();
            const botName = await hwangBot.getMe().then(me => me.username);
            let packName, packFullName;

            let creationCheck = false;
            for (let i = 0; i < 5; i++) {
                packName = crypto.randomBytes(8).toString('base64url').replace(/[^a-zA-Z0-9]/g, '');
                while (Number(packName.charAt(0))) packName = crypto.randomBytes(8).toString('base64url').replace(/[^a-zA-Z0-9]/g, '');
                packFullName = packName + '_by_' + botName;

                logger.info(`ADMIN | STICKER | [${conId} | ${conTitle}] STAGE 4 -> Packname: ${packFullName}`);

                mainStickerStream = fs.createReadStream(mainSticker.filepath, { highWaterMark: 64 * 1024 });

                creationCheck = await hwangBot.createNewStickerSet(
                    process.env.CHAT_ID_ADMIN,
                    packFullName,
                    conData.title,
                    mainStickerStream,
                    '🍞'
                );

                if (creationCheck) {
                    jobsInfo.progress(job.id);
                    logger.info(`ADMIN | STICKER | [${conId} | ${conTitle}] STAGE 4 -> Stickerpack Creation Success`);
                    break;
                }

                logger.error(`ADMIN | STICKER | [${conId} | ${conTitle}] STAGE 4 -> Stickerpack Creation Failed (${i}/5)`);
            }

            if (!creationCheck) {
                throw new Error('Stickerpack creation failed');
            }

            job.data.packFullName = packFullName;

            for (const { filepath, ext } of convertResult) {
                stickerStream = fs.createReadStream(filepath, { highWaterMark: 64 * 1024 });

                while (true) {
                    let registCheck = await hwangBot.addStickerToSet(
                        process.env.CHAT_ID_ADMIN,
                        packFullName,
                        stickerStream,
                        '🍞',
                        ext == 'webm' ? 'webm_sticker' : 'png_sticker',
                    );

                    if (registCheck) break;
                }
                jobsInfo.progress(job.id);
            }
        } catch (err) {
            throw err;
        }
    },
    { connection: redisClient }
);

worker.on('completed', job => {
    const { chatId, conId, conTitle, packFullName = '' } = job.data;

    insertPackageItem([conId, conTitle, packFullName]);
    jobsInfo.complete(job.id);

    hwangBot.sendMessage(chatId, 
        `<b>✅ [<a href='${getLink(LINK_STICKER, packFullName)}'>${conId}</a>] <code>${conTitle}</code> 제작 완료</b>`,
        {parse_mode: "HTML"}
    );
    logger.info(`ADMIN | STICKER | [${conId} | ${conTitle}] Stickerpack Creation Complete`);
});

worker.on('failed', (job, err) => {
    const { chatId, conId, conTitle } = job.data;

    hwangBot.sendMessage(chatId,
        `<b>❌ [<a href='${getLink(LINK_DCCON, conId)}'>${conId}</a>] <code>${conTitle}</code> 제작 실패</b>`,
        {parse_mode: "HTML"}
    );

    logger.error(`ADMIN | STICKER | [${conId} | ${conTitle}] Stickerpack Creation Failed`);
    logger.error(`Job ${job.id} failed: ${err.stack}`);
});