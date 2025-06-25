require('dotenv').config();
const fs = require('fs');

const getJsonData = () => {
    const jsonStr = fs.readFileSync('../../variables.json', 'utf8');
    const data = JSON.parse(jsonStr);

    return data;
}

const saveJsonData = (data) => {
    fs.writeFileSync('../../variables.json', JSON.stringify(data, null, 2), 'utf8');
}

const getNoBirdMessage = () => getJsonData().NO_BIRD_MESSAGE
const getNoBirdCount = () => getJsonData().NO_BIRD_COUNT
const getBlacklist = () => getJsonData().BLACKLIST;

const setNoBirdMessage = (msg) => {
    const data = JSON.parse(jsonStr);
    data.NO_BIRD_MESSAGE = msg;
    saveJsonData(data);
}
const setNoBirdCount = (count) => {
    const data = JSON.parse(jsonStr);
    data.NO_BIRD_COUNT = count;
    saveJsonData(data);
}

module.exports = {
    getNoBirdMessage,
    getNoBirdCount,
    getBlacklist,
    setNoBirdMessage,
    setNoBirdCount,
}