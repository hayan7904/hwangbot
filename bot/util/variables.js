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

const getNoBirdCount = () => {
    const data = getJsonData();
    return data.NO_BIRD_COUNT;
}

const setNoBirdCount = (count) => {
    const data = JSON.parse(jsonStr);
    data.NO_BIRD_COUNT = count;
    saveJsonData(data);
}

const getBlacklist = () => {
    const data = getJsonData();
    return data.BLACKLIST;
}

module.exports = {
    getNoBirdCount,
    setNoBirdCount,
    getBlacklist,
}