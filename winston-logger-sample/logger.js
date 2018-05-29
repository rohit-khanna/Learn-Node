/**
 *   DETAILS of various options is available at : https://github.com/winstonjs/winston
 */


'use strict'
const winstonLogger = require('winston');
const {
    combine,
    timestamp,
    label,
    printf
} = winstonLogger.format;
let loggerConfig = null;
let logger = null;

/**
 *    https://github.com/winstonjs/winston#logging
  error: 0, 
  warn: 1, 
  info: 2, 
  verbose: 3, 
  debug: 4, 
  silly: 5 
 */
exports.LOG_LEVEL = {
    error: "error",
    warn: 'warn',
    info: 'info',
    verbose: 'verbose',
    debug: 'debug',
    All: 'silly'
};


/**
 * Custom Log MessaGE FORMAT
 * Details: https://github.com/winstonjs/winston#combining-formats
 */
const myFormat = printf(info => {
    return ` ${info.ID}|${info.level}|${info.timestamp}|${info.label}| ${info.message}`;
});

/**
 * method to instantiate the Logger
 * @param {string} logLevel Log Level as per Sys Config
 */
function setLogger(logLevel) {
    logger = winstonLogger.createLogger({
        level: logLevel, // Log only if info.level less than or equal to this level
        colorize: true,
        format: combine(
            timestamp(), // ISOString in GMT
            myFormat
        ),
        transports: [
            new winstonLogger.transports.File({
                filename: __dirname + '/logs/errorOnly.log',
                level: 'error'
            }),
            new winstonLogger.transports.File({
                filename: __dirname + '/logs/allLogs.log'
            }) // for all including error/info/warn etc
        ],
        exceptionHandlers: [
            new winstonLogger.transports.File({
                filename: __dirname + '/logs/unhandledExceptions.log'
            }) // for uncaught exception
        ],
        exitOnError: false // stops the exit of server on unhandled exception: https://github.com/winstonjs/winston#to-exit-or-not-to-exit

    });
};

/**
 * method to set the config for logger
 * @param {*} loggerConfig JSON for Sys Config
 */
exports.setConfig = function (loggerConfig) {
    setLogger(loggerConfig["log-level"]);
};


/**
 * this function is used to Log  message into log File.
 * @param {string} message a string message
 * @param {string} level use LOG_LEVEL Enum
 * @param {*} tag tag name
 * @param {string} txnID unique ID for this REST txn
 */
exports.logMessage = function (message, level, tag, txnID) {
    logger.log({
        level: level,
        message: message,
        label: tag,
        ID: txnID
    });
}

/**
 * Method to query logs
 * @param {object} options 
 * @param {(err,results)} callback 
 */
exports.queryLogs = function (options) {
    logger.query(options, function (err, results) {
        if (err) {
            /* TODO: handle me */
            throw err;
        }

        console.log(results);
    });
}