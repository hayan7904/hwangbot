require('dotenv').config();

module.exports = {
    NO_BIRD_COUNT: process.env.NO_BIRD_COUNT || 15,
    BLACKLISTS: [52186264, 56796388]
}