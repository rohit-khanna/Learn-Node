const customLogger = require("./logger");
const shortid = require('shortid');


/**
 * UNCOMMENT WHat you need to test
 */
testForErrorOnlyLogging();
testForVerboseLogging();
//testForUnHandledException();







/**
 * This function depicts how Logging of Message is affected, by setting LOG-LEVEL to error
 */
function testForErrorOnlyLogging() {
    let loggerConfig = {
        "log-level": customLogger.LOG_LEVEL.error
    }

    customLogger.setConfig(loggerConfig);

    let txnID = shortid.generate();
    customLogger.logMessage("This is ERROR message 1 for same transaction", customLogger.LOG_LEVEL.error, "some-business-tag", txnID);
    customLogger.logMessage("This is ERROR message 2 for same transaction", customLogger.LOG_LEVEL.error, "some-business-tag", txnID);

    customLogger.logMessage("This is DEBUG message. Will not be logged", customLogger.LOG_LEVEL.debug, "some-business-tag", shortid.generate());
    customLogger.logMessage("This is INFO message. Will not be logged", customLogger.LOG_LEVEL.info, "some-business-tag", shortid.generate());
    customLogger.logMessage("This is VERBOSE message. Will  not be logged", customLogger.LOG_LEVEL.verbose, "some-business-tag", shortid.generate());
    customLogger.logMessage("This is WARN message. Will  not be logged", customLogger.LOG_LEVEL.warn, "some-business-tag", shortid.generate());
}

/**
 * This function depicts how Logging of Message is affected, by setting LOG-LEVEL to verbose
 */
function testForVerboseLogging() {
    let loggerConfig = {
        "log-level": customLogger.LOG_LEVEL.verbose
    }

    customLogger.setConfig(loggerConfig);

    let txnID = shortid.generate();
    customLogger.logMessage("This is ERROR message 3 for same transaction", customLogger.LOG_LEVEL.error, "some-business-tag", txnID);
    customLogger.logMessage("This is ERROR message 4 for same transaction", customLogger.LOG_LEVEL.error, "some-business-tag", txnID);

    customLogger.logMessage("This is DEBUG message. Will not be logged", customLogger.LOG_LEVEL.debug, "some-business-tag", shortid.generate());
    customLogger.logMessage("This is INFO message. Will be logged", customLogger.LOG_LEVEL.info, "some-business-tag", shortid.generate());
    customLogger.logMessage("This is VERBOSE message. Will be logged", customLogger.LOG_LEVEL.verbose, "some-business-tag", shortid.generate());
    customLogger.logMessage("This is WARN message. Will be logged", customLogger.LOG_LEVEL.warn, "some-business-tag", shortid.generate());
}

/**
 * This function depicts hopw the logger handles any 'unhandled exception' or runtime exception ins system.
 * Preventing the server to fail
 */
function testForUnHandledException() {
    let loggerConfig = {
        "log-level": customLogger.LOG_LEVEL.verbose
    }

    customLogger.setConfig(loggerConfig);
    customLogger.logMessage("tion", customLogger.LOG_LEVEL.error, "some-business-tag", txnID);

}