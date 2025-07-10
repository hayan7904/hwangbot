const appRoot = require('app-root-path');
const Database = require('better-sqlite3');

const db = new Database(`${appRoot}/sticker.db`);
const selectAllStickerStmt = db.prepare(`SELECT * FROM sticker ORDER BY created_at ASC`);
const selectStickerByIdStmt = db.prepare(`SELECT * FROM sticker WHERE id=?`);
const selectStickerByConIdStmt = db.prepare(`SELECT * FROM sticker WHERE con_id=?`);
const selectStickerOldest = db.prepare(`SELECT * FROM sticker ORDER BY created_at ASC LIMIT 1`);
const insertStickerStmt = db.prepare(`INSERT INTO sticker (chat_id, user_id, user_name, con_id, con_title, con_length) VALUES (?, ?, ?, ?, ?, ?)`);
const deleteAllStickerStmt = db.prepare(`DELETE FROM sticker`);
const deleteStickerByIdStmt = db.prepare(`DELETE FROM sticker WHERE id=?`);

const getQueue = () => selectAllStickerStmt.all();
const getQueueItemById = (id) => selectStickerByIdStmt.get([id]);
const getQueueItemByConId = (cid) => selectStickerByConIdStmt.get([cid]);
const getOldestQueueItem = () => selectStickerOldest.get();
const insertQueueItem = (args) => insertStickerStmt.run(args);
const deleteAllQueue = () => deleteAllStickerStmt.run();
const deleteQueueItem = (id) => deleteStickerByIdStmt.run([id]);

const selectAllPackageStmt = db.prepare(`SELECT * FROM package LIMIT ? OFFSET ?`);
const selectAllPackageCountStmt = db.prepare(`SELECT COUNT(*) AS total FROM package`);
const selectPackageByConIdStmt = db.prepare(`SELECT * FROM package WHERE con_id=?`);
const insertPackageStmt = db.prepare(`INSERT INTO package (con_id, con_title, pack_name) VALUES (?, ?, ?)`);
const deletePackageByConIdStmt = db.prepare(`DELETE FROM package WHERE con_id=?`)

const pageSize = parseInt(process.env.PACKAGE_PAGE_SIZE) || 10;

const getPackage = (page = 1) => selectAllPackageStmt.all(pageSize, (page - 1) * pageSize);
const getPackageCount = () => selectAllPackageCountStmt.get().total;
const getPackageItemByConId = (cid) => selectPackageByConIdStmt.get([cid]);
const insertPackageItem = (args) => insertPackageStmt.run(args);
const deletePackageItem = (cid) => deletePackageByConIdStmt.run([cid]);

const insertDoubleStmt = db.prepare(`INSERT INTO double (con_title, unique_id_1, unique_id_2, image, ext) VALUES (?, ?, ?, ?, ?)`);
const selectDoubleCountByUniqueIdStmt = db.prepare(`SELECT COUNT(*) AS total FROM double WHERE unique_id_1=:uniqueId OR unique_id_2=:uniqueId`);
const selectDoubleByUniqueIdStmt = db.prepare(`SELECT image FROM double WHERE unique_id_1=:uniqueId OR unique_id_2=:uniqueId`);

const insertDoubleItem = (args) => insertDoubleStmt.run(args);
const getDoubleCount = (uid) => selectDoubleCountByUniqueIdStmt.get({ uniqueId: uid }).total;
const getDoubleImageByUniqueId = (uid) => selectDoubleByUniqueIdStmt.get({ uniqueId: uid });

process.on('SIGINT', () => db.close());
process.on('exit', () => db.close());

module.exports = {
    getQueue,
    getQueueItemById,
    getQueueItemByConId,
    getOldestQueueItem,
    insertQueueItem,
    deleteAllQueue,
    deleteQueueItem,

    getPackage,
    getPackageCount,
    getPackageItemByConId,
    insertPackageItem,
    deletePackageItem,

    insertDoubleItem,
    getDoubleCount,
    getDoubleImageByUniqueId,
}