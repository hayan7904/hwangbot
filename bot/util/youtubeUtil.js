const axios = require('axios');
const { logger } = require('../../winston/logger.js');

const getYoutubeId = (url) => {
    let id = null;
    
    if (url.includes('/shorts/')) {
        id = url.substring(url.indexOf('/shorts/') + 8);
    } else if (url.includes('/watch?v=')) {
        id = url.substring(url.indexOf('/watch?v=') + 9);
    } else if (url.includes('.be/')) {
        id = url.substring(url.indexOf('.be/') + 4);
    }

    if (id.includes('?')) {
        id = id.substring(0, id.indexOf('?'));
    }

    logger.http(`Youtube ID: ${id}`);

    return id;
}

const getYoutubeData = (id, key) => {
    return axios.get(
        `https://www.googleapis.com/youtube/v3/videos?id=${id}&key=${key}&part=snippet`
    ).then((res) => {
        return res.data.items[0]?.snippet;
    }).catch((err) => {
        console.error(err);
    });
}

module.exports = {
    getYoutubeId,
    getYoutubeData,
}