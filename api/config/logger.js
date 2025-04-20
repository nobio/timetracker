const winston = require('winston');
const LokiTransport = require('winston-loki');

const options = {
    console: {
        level: process.env.LOKI_LOG_LEVEL || 'info',
        handleExceptions: true,
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`),
        ),
    },
    loki: {
        host: process.env.LOKI_HOST || 'http://loki:3100',
        labels: { app: 'timetracker' },
        json: true,
        format: winston.format.json(),
        replaceTimestamp: true,
        onConnectionError: (err) => winston.error(err),
    },
};

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console(options.console),
        new LokiTransport(options.loki),
    ],
    exitOnError: false,
});
logger.info(`Logger initialized with Loki and console transport with debug level: ${options.console.level} to loki: ${options.loki.host}`);
module.exports = logger;
