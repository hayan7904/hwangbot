const appRoot = require('app-root-path');
const Database = require('better-sqlite3');

const db = new Database(`${appRoot}/sticker.db`);
const selectAllStickerStmt = db.prepare(`SELECT * FROM sticker`);
const selectStickerByIdStmt = db.prepare(`SELECT * FROM sticker WHERE id=?`);
const selectStickerByConIdStmt = db.prepare(`SELECT * FROM sticker WHERE con_id=?`);
const insertStickerStmt = db.prepare(`INSERT INTO sticker (user_id, user_name, con_id, con_title) VALUES (?, ?, ?, ?)`);
const deleteAllStickerStmt = db.prepare(`DELETE FROM sticker`);
const deleteStickerByIdStmt = db.prepare(`DELETE FROM sticker WHERE id=?`);

const getQueue = () => selectAllStickerStmt.all();
const getQueueItemById = (id) => selectStickerByIdStmt.get([id]);
const getQueueItemByConId = (cid) => selectStickerByConIdStmt.get([cid]);
const insertQueueItem = (args) => insertStickerStmt.run(args);
const deleteAllQueue = () => deleteAllStickerStmt.run();
const deleteQueueItem = (id) => deleteStickerByIdStmt.run([id]);

const selectAllPackageStmt = db.prepare(`SELECT * FROM package`);
const selectPackageByConIdStmt = db.prepare(`SELECT * FROM package WHERE con_id=?`);
const insertPackageStmt = db.prepare(`INSERT INTO package (con_id, con_title, pack_name) VALUES (?, ?, ?)`);
const deletePackageByConIdStmt = db.prepare(`DELETE FROM package WHERE con_id=?`)

const getPackage = () => selectAllPackageStmt.all();
const getPackageItemByConId = (cid) => selectPackageByConIdStmt.get([cid]);
const insertPackageItem = (args) => insertPackageStmt.run(args);
const deletePackageItem = (cid) => deletePackageByConIdStmt.run([cid]);

module.exports = {
    getQueue,
    getQueueItemById,
    getQueueItemByConId,
    insertQueueItem,
    deleteAllQueue,
    deleteQueueItem,
    getPackage,
    getPackageItemByConId,
    insertPackageItem,
    deletePackageItem
}