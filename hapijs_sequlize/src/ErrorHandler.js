/****************************************************************************************
 *      this module exposes the methods for ERROR LOGGING And HANDLING                   *
 ****************************************************************************************/
const fs = require('fs');
const utility = require('./utility');
const DATE_FORMAT = "DDMMMYYHHmm";
var userDisplayMessage = "Oops Sorry. Server Error";

module.exports = {
    LOG_LEVEL: {
        INFO: 0, WARNING: 1, ERROR: 2
    },
    INVALID_TOKEN: 'Invalid Token Exception',
    TOKEN_MISSING: 'token missing',
    NO_ACTIVE_SESSION: "no active session found. please login again.",
    INCORRECT_OLD_PASSWORD: 'Incorrect old password',
    ERROR_ON_UPDATE: 'Error on update',
    SERVER_ERROR: "Server Error.",
    VALIDATION_FAILURE: "Failed Validation. Invalid Arguments",
    CREDENTIALS_NOT_SUPPLY: "Input Credentials Empty.",
    USER_NOT_ACTIVE: "User not activated",
    USER_NOT_AUTHORIZED: "User not authorized",
    LOGOUT_ERROR:"Error While Logout. Try Again",
    NO_EVENT_FOUND:"Event Not found",
    NO_FEEDBACK_FOUND:"Feedback Not found",
    INVALID_INPUT_PARAMS:"Invalid input parameters",
    USER_NOT_FOUND: "User not found",
    REQUEST_NOT_FOUND: "Request cannot be located",
    EMAIlSERVER_NOT_READY:"Email Server Not Ready for emails",
    /**
     method is used to Log the Exception into a Data Log
    */
    logMessage: function (message, logLevel) {

        fs.appendFile('./src/logs/logs.txt', prepareLogMessage(message, logLevel), function (err) {
            if (err)
                console.log(err);
        })

    },
    /**
     * method is used to Handle the exception.
     * This WILL log the exception and then MAY raise it.
     */
    handleException: function (exception) {
        //1. Log the Message
        this.logMessage(exception, this.LOG_LEVEL.ERROR)

        //2. Raise or suppress
        userDisplayMessage = exception.toString();
        //raiseException(userDisplayMessage);

        return userDisplayMessage;
    }
}



// var raiseException = function (exception) {
//     /**
//      * Decide the way to raise the exception.   ToDo
//      */
// }

var prepareLogMessage = function (message, logLevel) {
    return logLevel + "/" + utility.getFormattedDate(utility.getCurrDtTm(), DATE_FORMAT) + "/  " + 
    message.toString() + " " + message.stack + "\n";
}

