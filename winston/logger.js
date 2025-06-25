const winston = require('winston');
const winstonDaily = require('winston-daily-rotate-file');
const appRoot = require('app-root-path');
const { createLogger } = require('winston');
const moment = require('moment-timezone');

const { combine, timestamp, printf } = winston.format;

const logDir = `${appRoot}/logs`;
const logFormat = printf(({ level, timestamp, message }) => {
    return `${timestamp} | ${level} | ${message}`;
})

const logger = createLogger({
    format: combine(
        timestamp({
            format: () => moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
        }),
        logFormat,
    ),
    transports: [
        new winston.transports.File({
            level: "info",
            filename: `${logDir}/info.log`,
        }),
        new winston.transports.File({
            level: "error",
            filename: `${logDir}/error.log`,
        }),
        new winston.transports.Console({
            level: "http",
            format: winston.format.combine(
                winston.format.colorize(),
                logFormat,
            ),
        }),
    ],
});

module.exports = { 
    logger,
};