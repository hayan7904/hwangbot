require('dotenv').config();
const fs = require('fs');
const appRoot = require("app-root-path");

const getJsonData = () => {
    const jsonStr = fs.readFileSync(`${appRoot}/variables.json`, 'utf8');
    const data = JSON.parse(jsonStr);

    return data;
}

const saveJsonData = (data) => {
    fs.writeFileSync(`${appRoot}/variables.json`, JSON.stringify(data, null, 2), 'utf8');
}

const getNoBirdMessage = () => getJsonData().NO_BIRD_MESSAGE || '조류죽어';
const getNoBirdCount = () => getJsonData().NO_BIRD_COUNT || 15;
const getNoBirdDelay = () => getJsonData().NO_BIRD_DELAY || 500;
const getBlacklist = () => getJsonData().BLACKLIST;

const setNoBirdMessage = (msg) => {
    const data = getJsonData();
    data.NO_BIRD_MESSAGE = msg;
    saveJsonData(data);
}
const setNoBirdCount = (count) => {
    const data = getJsonData();
    data.NO_BIRD_COUNT = count;
    saveJsonData(data);
}
const setNoBirdDelay = (delay) => {
    const data = getJsonData();
    data.NO_BIRD_DELAY = count;
    saveJsonData(data);
}

module.exports = {
    getNoBirdMessage,
    getNoBirdCount,
    getNoBirdDelay,
    getBlacklist,
    setNoBirdMessage,
    setNoBirdCount,
    setNoBirdDelay,
}