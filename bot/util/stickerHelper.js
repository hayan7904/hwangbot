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
const { logger } = require('@logger/logger.js');

const mainPageUrl = 'https://dccon.dcinside.com/';
const pkgDetailApiEndPoint = 'https://dccon.dcinside.com/index/package_detail';
const imgApiEndPoint = 'https://dcimg5.dcinside.com/dccon.php';

const downloadPath = `${appRoot}/download`;
const convertPath = `${appRoot}/download/convert`;
const MAX_SIZE_STATIC = 512 * 1024 // 512kb
const MAX_SIZE_VIDEO = 256 * 1024 // 256kb

const progressState = {
    curr: 0,
    max: 0,
};

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

    const info = conData.info;
    const detail = conData.detail;

    return {
        cid,
        title: info.title,
        imagePath: [info.main_img_path, ...detail.map(item => item.path)],
    };
}

const downloadCon = async (conData) => {
    const downloadResult = [];

    if (fs.existsSync(downloadPath)) fs.rmSync(downloadPath, { recursive: true, force: true });

    fs.mkdirSync(convertPath, { recursive: true });

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
        progressState.curr++;
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

const convertGifToWebm = (input, output, bitrate, filters) => {
    return new Promise((resolve, reject) => {
        ffmpeg(input)
            .outputOptions([
                '-c:v libvpx-vp9',
                `-b:v ${bitrate}`,
                `-vf ${filters}`,
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

const convertCon = async (downloadResult) => {
    const convertResult = [];

    for (const { filepath, filename, ext } of downloadResult) {
        const newExt = ext == 'gif' ? 'webm' : 'webp';
        const output = path.join(convertPath, filename + '.' + newExt);

        if (newExt == 'webm') {
            let filters = `scale=512:512:force_original_aspect_ratio=decrease,fps=30`;
            await convertGifToWebm(filepath, output, '1M', filters);

            let duration = await getWebmDuration(output);
            const maxDuration = 3.0;

            while (duration > maxDuration) {
                const speedFactor = Math.floor((maxDuration / duration) * 10) / 10;
                filters += `,setpts=${speedFactor}*PTS`

                await convertGifToWebm(filepath, output, '1M', filters);
                duration = await getWebmDuration(output);
            }

            let bitrate = 950;
            while (fs.statSync(output).size > MAX_SIZE_VIDEO) {
                await convertGifToWebm(filepath, output, `${bitrate}K`, filters);
                bitrate -= 50;
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
        progressState.curr++;

        const outputSize = Math.floor(fs.statSync(output).size / 1024);
        const outputDuration = newExt == 'webm' ? await getWebmDuration(output) : '-';

        logger.info(`ADMIN | STICKER | ${filename}.${newExt} Converted -> Size: ${outputSize}KB | Duration: ${outputDuration}`);
    }

    return convertResult;
}

module.exports = {
    progressState,
    getConData,
    downloadCon,
    convertCon
}