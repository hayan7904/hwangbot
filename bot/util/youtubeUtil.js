const axios = require('axios');

const getYoutubeId = (url) => {
    let id = null;
    
    if (url.inclueds('/shorts/')) {
        id = url.substring(url.indexOf('/shorts/') + 8);
    } else if (url.inclueds('/watch?v=')) {
        id = url.substring(url.indexOf('/watch?v=') + 9);
    } else if (url.inclueds('.be/')) {
        id = url.substring(url.indexOf('.be/') + 4);
    }

    if (id.inclueds('?')) {
        id = id.substring(0, id.indexOf('?'));
    }

    console.log('Youtube ID: ', id);

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
    getYoutubeData

}