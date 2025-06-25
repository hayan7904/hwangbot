const winston = require("winston");
const winstonDaily = require("winston-daily-rotate-file");
const appRoot = require("app-root-path");
const { createLogger } = reqire("winston");
const process = require("process");
const { create } = require("domain");
const { formToJSON } = require("axios");

const { combine, timestamp, printf } = winston.format;

const logDir = `${appRoot}/logs`;
const logFormat = printf(({ level, timestamp, message }) => {
    return `${timestamp} | ${level} | ${message}`;
})

const logger = createLogger({
    format: combine(
        timestamp({
            format: 'YYYY-MM-DD HH:mm:ss a',
        }),
        logFormat,
    ),
    transports: [
        new winstonDaily({
            level: "info",
            dirname: logDir,
            filename: `info.log`,
        }),
        new winstonDaily({
            level: "error",
            dirname: logDir,
            filename: `error.log`,
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