require('dotenv').config();
const fs = require('fs');
const crypto = require('crypto');
const { hwangBot } = require('@/init.js');
const { commonCheck, blackCheck, adminChatCheck, adminUserCheck } = require('@util/commonHelper.js');
const { progressState, getConData, downloadCon, convertCon } = require('@util/stickerHelper.js');
const { getQueue, getQueueItemById, getQueueItemByConId, insertQueueItem, deleteAllQueue, deleteQueueItem,
        getPackage, getPackageCount, getPackageItemByConId, insertPackageItem, deletePackageItem,
} = require('@util/db/stickerDBUtil.js');
const { logger } = require('@logger/logger.js')

const inProgress = [];
const setProgressState = (state) => {
    if (inProgress.length > 0) {
        inProgress[0].state = state;
    }
}

let mainStickerStream, stickerStream;

const LINK_DCCON = 0;
const LINK_STICKER = 1;

const getLink = (type, arg) => {
    if (type == LINK_DCCON) {
        return `https://dccon.dcinside.com/#${arg}`;
    } else if (type == LINK_STICKER) {
        return `https://t.me/addstickers/${arg}`;
    }
}

const queueMapper = (item, idx) => {
    return `[<a href="${getLink(LINK_DCCON, item.con_id)}"><b>${item.con_id}</b></a>] <code>${item.con_title}</code> | ${item.user_name}\n`;
}

const packageMapper = (item, idx) => {
    return `[<a href="${getLink(LINK_STICKER, item.pack_name)}"><b>${item.con_id}</b></a>] <code>${item.con_title}</code> | <code>${item.pack_name}</code>\n`;
}

hwangBot.onText(/^\/sticker[\s]+(queue|list|create|permit|delete)(?:[\s]+(clear|[0-9]+))?$/, async (msg, match) => {
    // logger.http(`chat_id: ${msg.chat.id} | user_id: ${msg.from.id} | env: ${process.env.CHAT_ID_ADMIN}`);

    const op = match[1] || null;
    const arg = match[2] || null;

    if (!op || blackCheck(msg)) return;

    if (op === 'queue') {
        if (arg && arg == 'clear' && adminUserCheck(msg)) {
            const res = deleteAllQueue();

            if (res?.changes >= 0) {
                hwangBot.sendMessage(msg.chat.id, `<b>🗑 대기 중인 스티커 ${res.changes}개를 삭제했습니다.</b>`, {parse_mode: "HTML"});
            }
            return;
        }

        const queue = getQueue();

        let res = '<b>📌 제작 대기 목록:</b>\n\n';
        if (queue.length > 0) {
            res += [ ...queue.map((item, idx) => queueMapper(item, idx)) ].join('\n');
        } else {
            res += '<i>현재 대기중인 스티커가 없습니다.</i>\n';
        }

        if (inProgress.length > 0) {
            res += '\n<b>⚙️ 작업중:</b>\n\n';
            res += `[<a href="${getLink(LINK_DCCON, inProgress[0].con_id)}"><b>${inProgress[0].con_id}</b></a>] <code>${inProgress[0].con_title}</code> | ${inProgress[0].user_name}\n`;
            res += `진행상태: ${inProgress[0].state} ... (${progressState.curr}/${progressState.max})\n`;
        }

        hwangBot.sendMessage(msg.chat.id, res, {parse_mode: "HTML"});
    } else if (op === 'list') {
        const total = Math.max(Math.ceil(getPackageCount() / 10), 1);
        const page = Number(arg) ? Math.max(parseInt(arg), total) : 1;
        const package = getPackage(page);

        let res = `<b>📌 [${page}/${total}] 스티커팩 목록:</b>\n\n`;
        if (package.length > 0) {
            res += [ ...package.map((item, idx) => packageMapper(item, idx))].join('\n');
        } else {
            res += '<i>완성된 스티커가 없습니다.</i>\n';
        }

        hwangBot.sendMessage(msg.chat.id, res, {parse_mode: "HTML"});
    } else if (op === 'create' && Number(arg)) {
        try {
            const cid = parseInt(arg);

            const dupCheck = getPackageItemByConId(cid) || getQueueItemByConId(cid);
            if (dupCheck) {
                hwangBot.sendMessage(msg.chat.id, `<b>❌ 이미 제작중이거나 제작 완료된 스티커입니다.</b>`, {parse_mode: "HTML"});
                return;
            }

            const ctitle = await getConData(cid).then(res => res?.title);

            if (!ctitle) {
                hwangBot.sendMessage(msg.chat.id, `<b>❌ 디시콘을 찾을 수 없습니다.</b>`, {parse_mode: "HTML"});
                return;
            }

            const item = [msg.from.id, msg.from.first_name, cid, ctitle];
            const res = insertQueueItem(item);

            if (res?.changes > 0) {
                hwangBot.sendMessage(msg.chat.id,
                    `<b>📦 [<a href='${getLink(LINK_DCCON, cid)}'>${cid}</a>] <code>${ctitle}</code> 요청 완료</b>`,
                    {parse_mode: "HTML"}
                );

                logger.info(`COMMON | STICKER | Queue Created -> [${cid}] ${ctitle} | ${msg.from.first_name}`);
            } else {
                hwangBot.sendMessage(msg.chat.id,
                    `<b>❌ [<a href='${getLink(LINK_DCCON, cid)}'>${cid}</a>] <code>${ctitle}</code> 요청 실패</b>`,
                    {parse_mode: "HTML"}
                );
            }
        } catch (err) {
            logger.err(err.stack);
        }
    } else if (op == 'permit' && Number(arg) && adminUserCheck(msg)) {
        if (inProgress.length > 0) {
            hwangBot.sendMessage(msg.chat.id, '<b>❌ 현재 다른 스티커를 제작 중입니다.</b>', {parse_mode: "HTML"});
            return;
        }

        const cid = parseInt(arg);
        const item = getQueueItemByConId(cid);

        if (!item) {
            hwangBot.sendMessage(msg.chat.id, '<b>❌ 존재하지 않는 ID입니다.</b>');
            return;
        }

        hwangBot.sendMessage(msg.chat.id, 
            `<b>⚙️ [<a href='${getLink(LINK_DCCON, item.con_id)}'>${item.con_id}</a>] <code>${item.con_title}</code> 제작 시작</b>`,
            {parse_mode: "HTML"}
        );

        try {
            inProgress.push(item);

            setProgressState('정보 불러오는 중');
            const conData = await getConData(item.con_id); // cid, title, imagePath
            progressState.max = conData.imagePath.length;
            logger.info(`ADMIN | STICKER | [${item.con_id} | ${item.con_title}] STAGE 1 -> Fetch Complete`);

            setProgressState('이미지 다운로드 중');
            progressState.curr = 0;
            const downloadResult = await downloadCon(conData);
            logger.info(`ADMIN | STICKER | [${item.con_id} | ${item.con_title}] STAGE 2 -> Download Complete`);
            
            setProgressState('이미지 변환 중');
            progressState.curr = 0;
            const convertResult = await convertCon(downloadResult);
            logger.info(`ADMIN | STICKER | [${item.con_id} | ${item.con_title}] STAGE 3 -> Convert Complete`);


            setProgressState('스티커팩 제작 중');
            progressState.curr = 0;

            const mainSticker = convertResult.shift();
            const botName = await hwangBot.getMe().then(me => me.username);
            let packName, packFullName;

            while (true) {
                packName = crypto.randomBytes(8).toString('base64url').replace(/[^a-zA-Z0-9]/g, '');
                while (Number(packName.charAt(0))) packName = crypto.randomBytes(8).toString('base64url').replace(/[^a-zA-Z0-9]/g, '');
                packFullName = packName + '_by_' + botName;

                logger.info(`ADMIN | STICKER | [${item.con_id} | ${item.con_title}] STAGE 4 -> Packname: ${packFullName}`);

                mainStickerStream = fs.createReadStream(mainSticker.filepath, { highWaterMark: 64 * 1024 });

                const creationCheck = await hwangBot.createNewStickerSet(
                    process.env.CHAT_ID_ADMIN,
                    packFullName,
                    conData.title,
                    mainStickerStream,
                    '🍞'
                );

                if (creationCheck) {
                    progressState.curr++;
                    logger.info(`ADMIN | STICKER | [${item.con_id} | ${item.con_title}] STAGE 4 -> Stickerpack Creation Success`);
                    break;
                }

                hwangBot.sendMessage(msg.chat.id, '<b>❌ 스티커팩 생성에 실패했습니다.</b>', {parse_mode: "HTML"});
                logger.error(`ADMIN | STICKER | [${item.con_id} | ${item.con_title}] STAGE 4 -> Stickerpack Creation Failed`);
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
                progressState.curr++;
            }

            insertPackageItem([item.con_id, item.con_title, packFullName]);
            deleteQueueItem(item.id);

            hwangBot.sendMessage(msg.chat.id, 
                `<b>✅ [<a href='${getLink(LINK_STICKER, packFullName)}'>${item.con_id}</a>] <code>${item.con_title}</code> 제작에 성공했습니다.</b>`,
                {parse_mode: "HTML"}
            );

            logger.info(`ADMIN | STICKER | [${item.con_id} | ${item.con_title}] Stickerpack Creation Complete`);
        } catch (err) {
            hwangBot.sendMessage(msg.chat.id,
                `<b>❌ [<a href='${getLink(LINK_DCCON, item.con_id)}'>${item.con_id}</a>] <code>${item.con_title}</code> 제작에 실패했습니다.</b>`,
                {parse_mode: "HTML"}
            );
            
            logger.error(err.stack);
        } finally {
            inProgress.shift();
            progressState.curr = 0;
            progressState.max = 0;
        }
    } else if (op == 'delete' && Number(arg) && adminUserCheck(msg)) {
        const cid = parseInt(arg);
        const item = getPackageItemByConId(cid);

        if (!item) {
            hwangBot.sendMessage(msg.chat.id, '<b>❌ 존재하지 않는 ID입니다.</b>');
            return;
        }

        const res = deletePackageItem(cid);

        if (res?.changes > 0) {
            hwangBot.sendMessage(msg.chat.id,
                `<b>📦 [<a href='${getLink(LINK_DCCON, cid)}'>${cid}</a>] <code>${ctitle}</code> 스티커팩 삭제 완료</b>`,
                {parse_mode: "HTML"}
            );

            logger.info(`ADMIN | STICKER | Package Deleted -> [${cid}] ${item.con_title} | ${item.pack_name}`);
        } else {
            hwangBot.sendMessage(msg.chat.id,
                `<b>❌ [<a href='${getLink(LINK_DCCON, cid)}'>${cid}</a>] <code>${ctitle}</code> 스티커팩 삭제 실패</b>`,
                {parse_mode: "HTML"}
            );
        }
    }
});
