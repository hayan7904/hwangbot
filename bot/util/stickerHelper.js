const axios = require('axios');
const cookie = require('cookie');
const appRoot = require('app-root-path');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);
const sharp = require('sharp');
const logger = require('@logger/logger');

const mainPageUrl = 'https://dccon.dcinside.com/';
const pkgDetailApiEndPoint = 'https://dccon.dcinside.com/index/package_detail';
const imgApiEndPoint = 'https://dcimg5.dcinside.com/dccon.php';

const downloadPath = `${appRoot}/download`;
const convertPath = `${appRoot}/download/convert`;
const MAX_SIZE_STATIC = 512 * 1024 // 512kb
const MAX_SIZE_VIDEO = 256 * 1024 // 256kb

const jobsInfo = {
    jobs: new Map(),
    start(id, data) {
        if (this.jobs.has(id)) throw new Error('Job already exist');

        const job = {
            data,
            state: '🌐 데이터 가져오는 중',
            curr: 0,
            max: 0,
        };
        this.jobs.set(id, job);
    },
    complete(id) {
        if (!this.jobs.delete(id)) throw new Error('Job does not exist');
    },
    isWorking(id) {
        return this.jobs.has(id);
    },
    setState(id, state, conLength = 0) {
        const job = this.jobs.get(id);
        job.state = state;
        job.curr = 0;
        if (conLength) job.max = conLength;
    },
    progress(id) {
        const job = this.jobs.get(id);
        job.curr++;
        return job.curr;
    },
    getProgress(id) {
        return this.jobs.get(id);
    }
}

const LINK_DCCON = 0;
const LINK_STICKER = 1;

const getLink = (type, arg) => {
    if (type == LINK_DCCON) {
        return `https://dccon.dcinside.com/#${arg}`;
    } else if (type == LINK_STICKER) {
        return `https://t.me/addstickers/${arg}`;
    }
}

const getConData = async (cid) => {
    const cookies = await axios.get(mainPageUrl).then(res => res.headers['set-cookie']);
    const ci_t = cookies.map(cookie.parse).reduce((acc, curr) => { return { ...acc, ...curr }; }).ci_c;

    const reqBody = {
        ci_t,
        package_idx: cid,
        code: ''
    };
    const reqHeaders = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
    };
    const conData = await axios.post(
        pkgDetailApiEndPoint, 
        reqBody,
        { headers: reqHeaders },
    ).then(res => res.data);

    if (!conData || conData == 'error') return;

    const info = conData.info;
    const detail = conData.detail;

    return {
        cid,
        title: info.title,
        imagePath: [info.main_img_path, ...detail.map(item => item.path)],
    };
}

const downloadCon = async (conData, jid) => {
    const downloadResult = [];

    if (fs.existsSync(downloadPath)) fs.rmSync(downloadPath, { recursive: true, force: true });

    fs.mkdirSync(convertPath, { recursive: true });

    const half = Math.floor(conData.imagePath.length / 2);
    for (const img of conData.imagePath) {
        const reqHeaders = { 'Referer': mainPageUrl };
        const res = await axios.get(
            `${imgApiEndPoint}?no=${img}`,
            { 
                headers: reqHeaders,
                responseType: 'arraybuffer',
            }
        );

        const binary = res.data;
        const [filename, ext] = res.headers['content-disposition'].split('=')[1].split('.');

        const compressedBuffer = Buffer.from(binary);
        //const decompressedBuffer = zlib.gunzipSync(compressedBuffer);
        const output = path.join(downloadPath, `${filename}.${ext}`);

        fs.writeFileSync(output, compressedBuffer);
        downloadResult.push({
            filepath: output,
            filename,
            ext
        });

        jobsInfo.progress(jid);
        // if (jobsInfo.progress(jid) == half) {

        // }
    }

    return downloadResult;
}

const getWebmDuration = (input) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(input, (err, metadata) => {
            if (err) return reject(err);
            const duration = metadata.format.duration;
            resolve(duration);
        });
    });
}

const convertImageToWebm = (input, output, bitrate, filters, setpts = '') => {
    return new Promise((resolve, reject) => {
        ffmpeg(input)
            .outputOptions([
                '-c:v libvpx-vp9',
                `-b:v ${bitrate}`,
                `-vf ${filters}${setpts}`,
                '-an',
                '-pix_fmt yuva420p',
                '-auto-alt-ref 0',
            ])
            .save(output)
            //.on('start', cmd => logger.http(cmd))
            .on('end', () => resolve(output))
            .on('error', reject);
    });
}

const convertImageToWebp = (input, output, quality = null) => {
    return sharp(input)
            .resize(512, 512, {
                fit: 'inside'
            })
            .webp({ lossless: quality ? false : true, quality })
            .toFile(output);
}

const getNewExt = (input, ext) => {
    if (ext == 'gif') return 'webm';

    if (ext == 'png') {
        const fd = fs.openSync(input, 'r');
        const buffer = Buffer.alloc(1024);
        fs.readSync(fd, buffer, 0, buffer.length, 0);
        fs.closeSync(fd);

        if (buffer.includes('acTL') || buffer.includes('GIF')) return 'webm';
    }

    return 'webp';
}

const convertCon = async (downloadResult, jid) => {
    const convertResult = [];

    for (const { filepath, filename, ext } of downloadResult) {
        const newExt = getNewExt(filepath, ext);
        const output = path.join(convertPath, filename + '.' + newExt);

        if (newExt == 'webm') {
            let filters = `scale=512:512:force_original_aspect_ratio=decrease,fps=30`;
            let setpts = '';
            await convertImageToWebm(filepath, output, '1M', filters);

            const maxDuration = 3.0;
            let duration = await getWebmDuration(output);
            let speedFactor = Math.floor((maxDuration / duration) * 100) * 0.01;

            while (duration > maxDuration) {
                setpts = `,setpts=${speedFactor}*PTS`
                logger.info(`${filename}.${newExt} - duration: ${duration} | speedFactor: ${speedFactor}`);

                await convertImageToWebm(filepath, output, '1M', filters, setpts);
                duration = await getWebmDuration(output);
                speedFactor *= Math.floor((maxDuration / duration) * 100) * 0.01;
            }
            logger.info(`${filename}.${newExt} - result duration: ${duration}`);

            let bitrate = Math.floor(((255 * 1024) / fs.statSync(output).size) * 1000);
            logger.info(`${filename}.${newExt} - size: ${fs.statSync(output).size / 1024}KB`);
            while (fs.statSync(output).size > MAX_SIZE_VIDEO) {
                await convertImageToWebm(filepath, output, `${bitrate}K`, filters, setpts);
                logger.info(`${filename}.${newExt} - size: ${fs.statSync(output).size / 1024}KB | bitrate: ${bitrate}K`);
                bitrate -= 25;
            }
        } else {
            await convertImageToWebp(filepath, output);

            let quality = 100;
            while (fs.statSync(output).size > MAX_SIZE_STATIC) {
                await convertImageToWebp(filepath, output, quality);
                quality -= 5;
            }
        }

        convertResult.push({ filepath: output, ext: newExt });
        jobsInfo.progress(jid);

        const outputSize = Math.floor(fs.statSync(output).size / 1024);
        const outputDuration = newExt == 'webm' ? await getWebmDuration(output) : '-';

        logger.info(`ADMIN | STICKER | ${filename}.${newExt} | Converted -> Size: ${outputSize}KB | Duration: ${outputDuration}`);
    }

    return convertResult;
}

module.exports = {
    LINK_DCCON,
    LINK_STICKER,
    jobsInfo,
    getLink,
    getConData,
    downloadCon,
    convertCon
}