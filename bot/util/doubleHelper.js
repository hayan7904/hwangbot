require('dotenv').config();
const axios = require('axios');
const appRoot = require('app-root-path');
const fs = require('fs');
const { Readable, PassThrough } = require('stream');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);
const sharp = require('sharp');
const logger = require('@logger/logger');

const doubleInfo = {
    jobs: new Map(),
    start(id, type) {
        if (this.isWorking(id)) this.complete(id);
        this.jobs.set(id, { type, uniqueId: [], filePath: [] });
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
        return this.get(id)?.uniqueId.length >= 2;
    },
    isTypeOf(id, type) {
        return this.get(id)?.type == type;
    },
    continue(id) {
        if (this.isWorking(id)) this.get(id).uniqueId = [];
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
    .png()
    .toBuffer();

    return merged;
}

const mergeWebm = async (data, uniqueId) => {
    return new Promise((resolve, reject) => {
        const files = [`${appRoot}/${uniqueId[0]}.webm`, `${appRoot}/${uniqueId[1]}.webm`];
        const resultPath = `${appRoot}/result.mp4`;

        fs.writeFileSync(files[0], data[0]);
        fs.writeFileSync(files[1], data[1]);
        
        ffmpeg()
            .input(files[0])
            .input(files[1])
            .complexFilter('[0:v][1:v]hstack=inputs=2[v]')
            .outputOptions('-map', '[v]', '-an')
            // .format('webm')
            .videoCodec('libx264')
            .format('mp4') 
            .on('error', (err) => {
                if (fs.existsSync(files[0])) fs.rmSync(files[0]);
                if (fs.existsSync(files[1])) fs.rmSync(files[1]);
                if (fs.existsSync(resultPath)) fs.rmSync(resultPath);

                reject(err);
            })
            .on('end', () => {
                const buffer = fs.readFileSync(resultPath);

                if (fs.existsSync(files[0])) fs.rmSync(files[0]);
                if (fs.existsSync(files[1])) fs.rmSync(files[1]);
                if (fs.existsSync(resultPath)) fs.rmSync(resultPath);

                resolve(buffer);
            })
            .save(resultPath);
    });
}

const makeDoubleCon = async (id) => {
    const uniqueId = doubleInfo.get(id).uniqueId;
    const filePath = doubleInfo.get(id).filePath;
    const data = []

    try {
        const ext = [];
        filePath.forEach(path => { ext.push(path.split('.').pop()); });

        if (ext[0] != ext[1]) throw new Error('Extensions are different');

        for (const path of filePath) {
            const binary = await axios.get(
                `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_KEY}/${path}`,
                { responseType: 'arraybuffer' }
            ).then(res => res.data);
            const buffer = Buffer.from(binary);

            data.push(buffer);
        }

        const merged = ext[0] == 'webp' ? await mergeWebp(data) : await mergeWebm(data, uniqueId);

        return { res: merged, ext: ext[0] };
    } catch (err) {
        throw err;
    }
}

module.exports = {
    doubleInfo,
    makeDoubleCon,
}