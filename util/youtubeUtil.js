const axios = require('axios');

module.exports = {
    getYoutubeId: function(url) {
        let id = null;
    
        if (url.indexOf('/shorts/') !== -1) {
            id = url.substring(url.indexOf('/shorts/') + 8);
        } else if (url.indexOf('/watch?v=') !== -1) {
            id = url.substring(url.indexOf('/watch?v=') + 9);
        } else if (url.indexOf('.be/') !== -1) {
            id = url.substring(url.indexOf('.be/') + 4);
        }
    
        if (id.indexOf('?') !== -1) {
            id = id.substring(0, id.indexOf('?'));
        }
    
        console.log('Youtube ID: ', id);
    
        return id;
    },
    getYoutubeData: async function(id, key) {
        try {
            const res = await axios.get(`https://www.googleapis.com/youtube/v3/videos?id=${id}&key=${key}&part=snippet`);
            return res.data.items[0]?.snippet;
        } catch (err) {
            console.error(err);
        }
    }
}