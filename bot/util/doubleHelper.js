require('dotenv').config();
const fs = require('fs');
const axios = require('axios');
const appRoot = require('app-root-path');
const sharp = require('sharp');
const logger = require('@logger/logger');

const doubleInfo = {
    jobs: new Map(),
    start(id) {
        this.jobs.set(id, { uniqueId: [], filePath: [] });
    },
    add(id, uid, path) {
        if (!this.jobs.has(id)) return;

        const job = this.jobs.get(id);

        job.uniqueId.push(uid);
        job.filePath.push(path);
    },
    isWorking(id) {
        return this.jobs.has(id);
    },
    isReady(id) {
        return this.get(id)?.uniqueId.length == 2;
    },
    complete(id) {
        this.jobs.delete(id);
    },
    get(id) {
        return this.jobs.get(id);
    }
}

const mergeWebp = async (data) => {
    const metadata = await sharp(data[0]).metadata();
    const width = metadata.width * 2;
    const height = metadata.height;
    const channels = metadata.channels;
    const background = channels == 4 ? { r: 0, g: 0, b: 0, alpha: 0 } : { r: 255, g: 255, b: 255};

    const merged = await sharp({
        create: {
            width,
            height,
            channels,
            background
        },
    })
    .composite([
        { input: data[0], top: 0, left: 0 },
        { input: data[1], top: 0, left: metadata.width },
    ])
    .webp()
    .toBuffer();

    return merged;
}

const makeDoubleCon = async (id) => {
    const filePath = doubleInfo.get(id).filePath;
    const data = []

    try {
        const ext = filePath[0].split('.').pop();

        for (const path of filePath) {
            const binary = await axios.get(
                `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_KEY}/${path}`,
                { responseType: 'arraybuffer' }
            ).then(res => res.data);
            const buffer = Buffer.from(binary, 'binary');

            data.push(buffer);
        }

        const merged = ext == 'webp' ? await mergeWebp(data) : null;

        return merged;
    } catch (err) {
        throw err;
    }
}

module.exports = {
    doubleInfo,
    makeDoubleCon,
}