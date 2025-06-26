require('dotenv').config();
const { hwangBot } = require('./init.js');
const { commonCheck, adminCheck } = require('./util/helper.js');
const { getQueue, getQueueItem, insertQueueItem, deleteAllQueue, deleteQueueItem } = require('./util/stickerDBUtil.js');
const { logger } = require('../winston/logger.js')

hwangBot.onText(/^\/sticker(?:\s+(create|queue|permit)\s+([0-9a-z]+))?$/, (msg, match) => {
    const op = match[1] || null;
    const arg = match[2];

    if (!op) return;

    if (op == 'queue') {
        if (arg && arg == 'clear') {
            deleteAllQueue();
            return;
        }

        const queue = getQueue();
        const res = [];
        if (adminCheck(msg)) {
            res = [ ...queue.map((row, idx) => `[${idx + 1}] ${row.id} | ${row.user_name} | ${row.con_id}`) ].join('\n');
        } else {
            res = [ ...queue.map((row, idx) => `[${idx + 1}] ${row.user_name} | ${row.con_id}`) ].join('\n');
        }

        hwangBot.sendMessage(msg.chat.id, res);
    } else if (op == 'create'&& Number.isInteger(arg)) {
        const cid = parseInt(arg);
        const item = [msg.from.id, msg.from.first_name, cid];

        const res = insertQueueItem(item);

        if (res?.changes > 0) {
            hwangBot.sendMessage(msg.chat.id, '요청 완료');
            logger.info(`COMMON | STICKER | Queue created... < USER: [${msg.from.id}] ${msg.from.first_name} | QID: ${res?.lastInsertRowid}`)
        } else {
            hwangBot.sendMessage(msg.chat.id, '요청 실패');
        }
    } else if (op == 'permit' && adminCheck(msg) && Number.isInteger(arg)) {
        const qid = parseInt(arg);
        const res = getQueueItem(qid);

        if (!res) {
            hwangBot.sendMessage(msg.chat.id, '존재하지 않는 id입니다.');
        } else {
            // TODO: Create Sticker-pack
            deleteQueueItem(qid);
        }
    }
});
