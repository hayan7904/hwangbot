const appRoot = require('app-root-path');
const Database = require('better-sqlite3');

const db = new Database(`${appRoot}/sticker.db`);
const selectAllStmt = db.prepare(`SELECT * FROM sticker`);
const selectByIdStmt = db.prepare(`SELECT user_id, user_name, con_id FROM sticker WHERE id=?`);
const insertStmt = db.prepare(`INSERT INTO sticker (user_id, user_name, con_id) VALUES (?, ?, ?)`);
const deleteAllStmt = db.prepare(`DELETE FROM sticker`);
const deleteByIdStmt = db.prepare(`DELETE FROM sticker WHERE id=?`);

const getQueue = () => selectAllStmt.all();
const getQueueItem = (id) => selectByIdStmt.get([id]);
const insertQueueItem = (args) => insertStmt.run(args);
const deleteAllQueue = () => deleteAllQueue.run();
const deleteQueueItem = (id) => deleteByIdStmt.run([id]);

module.exports = {
    getQueue,
    getQueueItem,
    insertQueueItem,
    deleteAllQueue,
    deleteQueueItem,
}