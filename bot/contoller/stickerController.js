require('dotenv').config();
const fs = require('fs');
const crypto = require('crypto');
const hwangBot = require('@/init');
const { commonCheck, blacklistCheck, adminChatCheck, adminUserCheck } = require('@util/commonHelper');
const { workInfo, LINK_DCCON, LINK_STICKER, getLink, getConData, downloadCon, convertCon } = require('@util/stickerHelper');
const { getBlacklistFlag } = require('@util/db/commonDBUtil');
const { getQueue, getQueueItemById, getQueueItemByConId, insertQueueItem, deleteAllQueue, deleteQueueItem,
        getPackage, getPackageCount, getPackageItemByConId, insertPackageItem, deletePackageItem,
} = require('@util/db/stickerDBUtil');
const logger = require('@logger/logger')

let mainStickerStream, stickerStream;

const queueMapper = (item, idx) => {
    const state = (workInfo.isWorking() && workInfo.getProgress().item.con_id == item.con_id) ? '(제작 중)' : '';
    return `[<a href="${getLink(LINK_DCCON, item.con_id)}"><b>${item.con_id}</b></a>] <code>${item.con_title}</code> | ${item.user_name} ${state}\n`;
}

const packageMapper = (item, idx) => {
    return `[<a href="${getLink(LINK_STICKER, item.pack_name)}"><b>${item.con_id}</b></a>] <code>${item.con_title}</code> | <code>${item.pack_name}</code>\n`;
}

hwangBot.onText(/^\/sticker[\s]+(queue|list|make|delete)(?:[\s]+(clear|[0-9]+))?$/, async (msg, match) => {
    // logger.http(`chat_id: ${msg.chat.id} | user_id: ${msg.from.id} | env: ${process.env.CHAT_ID_ADMIN}`);

    const op = match[1] || null;
    const arg = match[2] || null;

    if (!op || (getBlacklistFlag() && blacklistCheck(msg))) return;

    if (op === 'queue') {
        if (arg && arg == 'clear' && adminUserCheck(msg)) {
            const res = deleteAllQueue();

            if (res?.changes >= 0) {
                hwangBot.sendMessage(msg.chat.id, `<b>🗑 대기 중인 스티커 ${res.changes}개를 삭제했습니다.</b>`, {parse_mode: "HTML"});
            }
            return;
        }

        const queue = getQueue();

        let res = '<b>📌 제작 대기:</b>\n\n';
        if (queue.length > 0) {
            res += [ ...queue.map((item, idx) => queueMapper(item, idx)) ].join('\n');
        } else {
            res += '<i>현재 대기 중인 스티커가 없습니다.</i>\n';
        }

        if (workInfo.isWorking()) {
            const progress = workInfo.getProgress();
            const percentage = Math.floor((progress.curr / progress.max) * 100);
            let progressBar = '';
            
            for (let i = 0; i < percentage; i += 5) {
                progressBar += '■';
            }
            for (let i = 100; i > percentage; i -= 5) {
                progressBar += '□';
            }

            res += '\n<b>⚙️ 제작 중:</b>\n\n';
            res += `[<a href="${getLink(LINK_DCCON, progress.item.con_id)}"><b>${progress.item.con_id}</b></a>] <code>${progress.item.con_title}</code> | ${progress.item.user_name}\n\n`;
            res += `${progress.state} ... \n`;
            res += `[${progressBar}] ${percentage}% (${progress.curr}/${progress.max})\n\n`;
        }

        hwangBot.sendMessage(msg.chat.id, res, {parse_mode: "HTML"});
    } else if (op === 'list') {
        const pageSize = parseInt(process.env.PACKAGE_PAGE_SIZE) || 10;
        const total = Math.max(Math.ceil(getPackageCount() / pageSize), 1);
        const page = Number(arg) ? parseInt(arg) <= total ? parseInt(arg) > 0 ? parseInt(arg) : 1 : total : 1;
        const package = getPackage(page);

        let res = `<b>📌 [${page}/${total}] 스티커팩 목록:</b>\n\n`;
        if (package.length > 0) {
            res += [ ...package.map((item, idx) => packageMapper(item, idx))].join('\n');
        } else {
            res += '<i>완성된 스티커가 없습니다.</i>\n';
        }

        hwangBot.sendMessage(msg.chat.id, res, {parse_mode: "HTML"});
    } else if (op === 'make' && Number(arg)) {
        try {
            const cid = parseInt(arg);

            const dupCheck = getPackageItemByConId(cid) || getQueueItemByConId(cid);
            if (dupCheck) {
                hwangBot.sendMessage(msg.chat.id, '<b>❌ 이미 제작 중이거나 제작 완료된 스티커입니다.</b>', {parse_mode: "HTML"});
                return;
            }

            const conData = await getConData(cid);

            if (!conData) {
                hwangBot.sendMessage(msg.chat.id, '<b>❌ 디시콘을 찾을 수 없습니다.</b>', {parse_mode: "HTML"});
                throw new Error(`Cannot find dccon ${cid}`)
            }

            const item = [msg.chat.id, msg.from.id, msg.from.first_name, cid, conData.title, conData.imagePath.length];
            const res = insertQueueItem(item);

            if (res?.changes > 0) {
                hwangBot.sendMessage(msg.chat.id,
                    `<b>📦 [<a href='${getLink(LINK_DCCON, cid)}'>${cid}</a>] <code>${conData.title}</code> 요청 완료</b>`,
                    {parse_mode: "HTML"}
                );

                logger.info(`COMMON | STICKER | Queue created -> [${cid}] ${conData.title} | ${msg.from.first_name}`);
            } else {
                hwangBot.sendMessage(msg.chat.id,
                    `<b>❌ [<a href='${getLink(LINK_DCCON, cid)}'>${cid}</a>] <code>${conData.title}</code> 요청 실패</b>`,
                    {parse_mode: "HTML"}
                );
                throw new Error(`Queue creation failed`)
            }
        } catch (err) {
            logger.error(err.stack);
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
