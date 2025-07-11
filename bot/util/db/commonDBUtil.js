const appRoot = require('app-root-path');
const Database = require('better-sqlite3');

const keys = {
    noBirdMsg: "NO_BIRD_MESSAGE",
    noBirdCnt: "NO_BIRD_COUNT",
    noBirdDly: "NO_BIRD_DELAY",
    blacklist: "BLACKLIST",
    blacklistFlag: "BLACKLIST_FLAG",
};

const db = new Database(`${appRoot}/variable.db`);
const selectByKeyStmt = db.prepare(`SELECT value FROM variable WHERE key=?`);
const updateByKeyStmt = db.prepare(`UPDATE variable SET value=? WHERE key=?`);
const insertStmt = db.prepare(`INSERT INTO variable (key, value) VALUES (?, ?)`);
const deleteByKeyAndValueStmt = db.prepare(`DELETE FROM variable WHERE key=? AND value=?`)

const getNoBirdMessage = () => selectByKeyStmt.get(keys.noBirdMsg)?.value;
const getNoBirdCount = () => parseInt(selectByKeyStmt.get(keys.noBirdCnt)?.value);
const getNoBirdDelay = () => parseInt(selectByKeyStmt.get(keys.noBirdDly)?.value);
const getBlacklist = () => selectByKeyStmt.all(keys.blacklist).map((row) => parseInt(row.value));
const getBlacklistFlag = () => selectByKeyStmt.get(keys.blacklistFlag)?.value == 'YES';

const setNoBirdMessage = (msg) => updateByKeyStmt.run([msg, keys.noBirdMsg]);
const setNoBirdCount = (count) => updateByKeyStmt.run([count, keys.noBirdCnt]);
const setNoBirdDelay = (delay) => updateByKeyStmt.run([delay, keys.noBirdDly]);
const insertBlacklist = (id) => insertStmt.run([keys.blacklist, id]);
const deleteBlacklist = (id) => deleteByKeyAndValueStmt.run([keys.blacklist, id]);

process.on('SIGINT', () => db.close());
process.on('exit', () => db.close());

module.exports = {
    getNoBirdMessage,
    getNoBirdCount,
    getNoBirdDelay,
    getBlacklist,
    getBlacklistFlag,
    setNoBirdMessage,
    setNoBirdCount,
    setNoBirdDelay,
    insertBlacklist,
    deleteBlacklist,
}