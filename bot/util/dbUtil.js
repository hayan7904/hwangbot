const appRoot = require('app-root-path');
const Database = require('better-sqlite3');

const keys = {
    noBirdMsg: "NO_BIRD_MESSAGE",
    noBirdCnt: "NO_BIRD_COUNT",
    noBirdDly: "NO_BIRD_DELAY",
    blacklist: "BLACKLIST",
};

const db = new Database(`${appRoot}/variables.db`);
const selectStmt = db.prepare(`SELECT value FROM variables WHERE key=?`);
const updateStmt = db.prepare(`UPDATE variables SET value=? WHERE key=?`);

const getNoBirdMessage = () => selectStmt.get(keys.noBirdMsg)?.value;
const getNoBirdCount = () => parseInt(selectStmt.get(keys.noBirdCnt)?.value);
const getNoBirdDelay = () => parseInt(selectStmt.get(keys.noBirdDly)?.value);
const getBlacklist = () => selectStmt.all(keys.blacklist).map((row) => parseInt(row.value));

const setNoBirdMessage = (msg) => updateStmt.run([msg, keys.noBirdMsg]);
const setNoBirdCount = (count) => updateStmt.run([count, keys.noBirdCnt]);
const setNoBirdDelay = (delay) => updateStmt.run([delay, keys.noBirdDly]);

process.on('exit', () => db.close());
process.on('exit', () => db.close());

module.exports = {
    getNoBirdMessage,
    getNoBirdCount,
    getNoBirdDelay,
    getBlacklist,
    setNoBirdMessage,
    setNoBirdCount,
    setNoBirdDelay,
}