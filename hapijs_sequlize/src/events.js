'use strict';
const modelSchema = require('./model/csrModelsSchema');
const utility = require('./utility');
const models = require('./model/csrModels');
const errHandler = require('./ErrorHandler');
const sessions = require('./model/activeSessions');
const API = require('./DataAPI');
const Utils = require('./utils/index');
const fs = require('fs');
const Joi = require('joi');
const provider = require('./Notification/notificationProvider');


const currentDtTm = utility.getCurrDtTm();

module.exports.events = {

    /**
    This function is used to return the list of events as per following.
    ** If (isFutureEvent,dateTimeStamp) => (true,<null>): return all events starting from TODAY (3)
       If (isFutureEvent,dateTimeStamp) => (false,<null>): return all events      (4) 
    * @param {*}  token  : security token

    * @param {*}  isFutureEvent  : depicts whether to consider only Future events.
                               if true: it returns only future events STARTING from param:'dateTimeStamp' (1)
                               if false: return all events TILL param:'dateTimeStamp' (2)
    * @param {*}  dateTimeStamp  : timestamp of event search. 
    * @param {*}  isAllEventRequest  : erquest for ALL events?  true: yes -  false:only activated
    * @param {*}  callback  : callback
    
    */
    getEvents: function (token, isFutureEvent, dateTimeStamp, siteLocation, isAllEventRequest, callback) {

       
        var resultJSON = new models.responseModel();
        var startDtTm = null; // filter start date time
        var endDtTm = null; // filter end date time

        if (checkTokenValidity
            (token, function (errMsg, user) {
                if (errMsg) {
                    resultJSON = raiseInvalidTokenException(resultJSON, errMsg);
                    return callback(errMsg, resultJSON);
                }
            })
        ) {

            if (isFutureEvent == "true") { // (1)
                startDtTm = (utility.IsNullOrEmpty(dateTimeStamp) || dateTimeStamp == "0")
                    ? currentDtTm : dateTimeStamp; //(3)
                endDtTm = utility.getSomeDate(10);
            }
            else { // (2)
                startDtTm = utility.getSomeDate(-10);
                endDtTm = (utility.IsNullOrEmpty(dateTimeStamp) || dateTimeStamp == "0")
                    ? utility.getSomeDate(10) : dateTimeStamp;;
            }
            // make a call to API
            try {
                API.getCSREvents(startDtTm, endDtTm, siteLocation, isAllEventRequest, function (error, data) {
                  
                    resultJSON.data = data;
                    resultJSON.forceLogout = false;
                    resultJSON.error = null;
                    return callback(error, resultJSON);
                });

            }
            catch (exception) {
                
                resultJSON.data = [];
                resultJSON.forceLogout = false;
                resultJSON.error = errHandler.handleException(exception);
                return callback(exception, resultJSON);
            }

            return resultJSON;
        }
    },

    /**
     * method to return Event Location List
     */
    getLocationList: function (callback) {
        var resultJSON = new models.responseModel();
        try {

            API.getLocations(function (error, data) {
                resultJSON.data = data;
                resultJSON.forceLogout = false;
                resultJSON.error = error;
                return callback(error, resultJSON);

            });
        }
        catch (exception) {
            resultJSON.data = [];
            resultJSON.forceLogout = false;
            resultJSON.error = errHandler.handleException(exception);
            return callback(exception, resultJSON);
        }
    },


    /**
     * this function is used to return the details of input eventID
     */
    getEventDetails: function (eventID, token, callback) {
        let resultJSON = new models.responseModel();

        if (checkTokenValidity
            (token, function (errMsg, user) {
                if (errMsg) {
                    resultJSON = raiseInvalidTokenException(resultJSON, errMsg);
                    return callback(errMsg, resultJSON);
                }
            })
        ) {

            // make a call to API
            try {
                API.getEventDetails(eventID, function (error, data) {
                    resultJSON.data.push(data.dataValues);
                    resultJSON.forceLogout = false;
                    resultJSON.error = error;
                    return callback(error, resultJSON);
                });

            }
            catch (exception) {
                resultJSON.data = [];
                resultJSON.forceLogout = false;
                resultJSON.error = errHandler.handleException(exception);
                return callback(exception, resultJSON);
            }
        }
    },

    /**
     * this function is used to submit a time slot request for the user for 
     * a particular event. The following steps should be taken care :
     *  0. Verify the Token
     *  1. look for valid EventId
     *  2. verify whether the input startDtTm and endDtTm are in accordance with event Details
     *  3. create a new event Request. (status=APPROVED in case user is internal, else PENDING)
     */
    submitTimeSlot: function (eventid, startDtTm, endDtTm, token, callback) {
        let resultJSON = new models.responseModel();
        let userID = 0;
        if (checkTokenValidity
            (token, function (errMsg, user) {
                userID = user;
                if (errMsg) {
                    resultJSON = raiseInvalidTokenException(resultJSON, errMsg);
                    return callback(errMsg, resultJSON);
                }
            })
        ) {
            if (!utility.IsNullOrEmpty(startDtTm) && !utility.IsNullOrEmpty(endDtTm)) {

                //1, look for valid eventID
                API.getEventDetails(eventid, function (error, event) {
                    if (!error) // no error
                    {
                        let data = event.dataValues;
                        //2.
                        if (verifyTimeSlots(utility.getTimestamp(data.startDtTm), utility.getTimestamp(data.endDtTm),
                            startDtTm, endDtTm)) {

                            API.getUser(userID, function (error, data) {
                                //let status = data.dataValues.isInternal ? "APPROVED" : "PENDING";
                                let status = "PENDING";
                                API.AddVolunteerRequest(event, data.dataValues.id, startDtTm, endDtTm, status,
                                    function (error, data) {
                                        resultJSON.data.push(data);
                                        resultJSON.forceLogout = false;
                                        resultJSON.error = error;
                                        return callback(error, resultJSON);
                                    });
                            });
                        }
                    }
                    else { // raise
                        resultJSON = raiseInvalidEventParamsException(resultJSON, error);
                        return callback(error, resultJSON);
                    }
                });
            }
            else {
                resultJSON = raiseInvalidEventParamsException(resultJSON, errHandler.INVALID_INPUT_PARAMS);
                return callback(errHandler.INVALID_INPUT_PARAMS, resultJSON);
            }




        }// end if
    },

    /**
     * this method is used to fetch the volunteer request for the user associated 
     * with the token.
     * eventId is an optional parameter here. If provided, user will be returned
     * all the request by user for that event.
     * If event Not Found, an error will be thrown.
     */
    getRequestHistory: function (token, eventId, callback) {
        let resultJSON = new models.responseModel();
        let userID = 0;
        if (checkTokenValidity
            (token, function (errMsg, user) {
                userID = user;
                if (errMsg) {
                    resultJSON = raiseInvalidTokenException(resultJSON, errMsg);
                    return callback(errMsg, resultJSON);
                }
            })
        ) {
            // make a call to API
            try {
                API.getUserRequests(userID, eventId, function (error, data) {
                    resultJSON.data = data;
                    resultJSON.forceLogout = false;
                    resultJSON.error = error;
                    return callback(error, resultJSON);
                });

            }
            catch (exception) {
                resultJSON.data = [];
                resultJSON.forceLogout = false;
                resultJSON.error = errHandler.handleException(exception);
                return callback(exception, resultJSON);
            }
        }
    },

    /**
     * this method is used to return the user details for the input UserID.
     * Here Token is used to VALIDATE the request .
     * If userID is not provided, details associated with token user will be returned.
     */
    getUserDetails: function (token, userIdToFind, callback) {
        let resultJSON = new models.responseModel();
        let userID = 0;
        if (checkTokenValidity
            (token, function (errMsg, user) {

                if (userIdToFind) // id provided during invocation
                    userID = userIdToFind;
                else
                    userID = user;

                if (errMsg) {
                    resultJSON = raiseInvalidTokenException(resultJSON, errMsg);
                    return callback(errMsg, resultJSON);
                }
            })
        ) {
            // make a call to API
            try {
                API.getUser(userID, function (error, data) {
                    resultJSON.data.push(data);
                    resultJSON.forceLogout = false;
                    resultJSON.error = error;
                    return callback(error, resultJSON);
                });

            }
            catch (exception) {
                resultJSON.data = [];
                resultJSON.forceLogout = false;
                resultJSON.error = errHandler.handleException(exception);
                return callback(exception, resultJSON);
            }
        }
    },

    /**
     * this method is used to upload images and return relative paths
     */
    uploadImages: function (token, imageFile, callback) {
        let imagPaths = [];
        let resultJSON = new models.responseModel();
        let outputData = function (e, p) { this.error = e; this.path = p };
        if (checkTokenValidityForImageUpload(token, function (errMsg, user) {
            if (errMsg) {
                resultJSON = raiseInvalidTokenException(resultJSON, errMsg);
                return callback(errMsg, resultJSON);
            }
        })
        ) {
            // make a call to API
            try {

                if (imageFilter(imageFile.hapi.filename) == false) // not an imageFile
                {
                    imagPaths.push(new outputData("not an image file", null));
                    resultJSON.data = imagPaths;
                    resultJSON.forceLogout = false;
                    resultJSON.error = null;
                    callback(null, resultJSON);
                }
                else {

                    uploadFileToStorageLocation(imageFile, function (err, data) {
                        if (err) {
                            imagPaths.push(new outputData(err, null));
                        }
                        else {
                            imagPaths.push(new outputData(null, data));
                        }
                        resultJSON.data = imagPaths;
                        resultJSON.forceLogout = false;
                        resultJSON.error = null;
                        callback(null, resultJSON);
                    });
                }
            }
            catch (exception) {
                callback(exception, new outputData(exception, null));
            }
        }
    },

    /**
     * this method is used to Create a new Event Feedback
     * This validates the input payload for the schema of table
     */
    createEventFeedback: function (token, payload, callback) {
        let feedbackModelSchema = modelSchema.modelDbSchema.eventFeedbackSchema;
        let resultJSON = new models.responseModel();
        let userID = 0;
        let results = Joi.validate(payload, Utils.schema.eventFeedbackValidationSchema);
        if (results.error) {
            console.log("Failed Validation!!!!!");
            return callback(null, new models.responseModel(errHandler.VALIDATION_FAILURE, [], false));
        }
        else {
            //1. validate token and extract userID
            if (checkTokenValidity
                (token, function (errMsg, user) {
                    userID = user;
                    if (errMsg) {
                        resultJSON = raiseInvalidTokenException(resultJSON, errMsg);
                        return callback(errMsg, resultJSON);
                    }
                })
            ) {
                payload.volunteerId = userID;
                //2. validate event FOR INPUT eventId
                API.checkForEventExistence(payload.eventId, function (data) {
                    if (data == true) // found event
                    {
                        API.ManageEventFeedback(0, payload, function (error, data) {
                            resultJSON.data = data;
                            resultJSON.forceLogout = false;
                            resultJSON.error = error;
                            return callback(error, resultJSON);
                        });
                    }
                    else {
                        return callback(null, new models.responseModel(errHandler.NO_EVENT_FOUND, [], false));
                    }

                });
            }

        }
    },

    /**
     * this method is used to return the feedback submiited against an EVENT by a USER.
     * the data is returned as follows:
     * 
     * token	    userId	    eventId	    Result
     * -----        -------     -------     -----------------------
     1   yes	          -1	      -1    No result
     2   yes	          yes	      -1    Return all feedbacks for all events for this user
     3   yes	          -1	      yes    Return all feedbacks for this event
     4   yes	          yes	      yes    Return feedback for this user for this event
     5   NULL	          yes	      yes    Invalid Token error result
     */
    getFeedback: function (token, userId, eventId, callback) {
        let resultJSON = new models.responseModel();
        if (checkTokenValidity
            (token, function (errMsg, user) {
                if (errMsg) {
                    resultJSON = raiseInvalidTokenException(resultJSON, errMsg);
                    return callback(errMsg, resultJSON);
                }
            })
        ) {
            let whereClause = {};

            if (eventId == -1 || eventId == "-1") {
                if (userId == -1 || userId == "-1") //1 No result
                {
                    resultJSON.data = [];
                    resultJSON.forceLogout = false;
                    resultJSON.error = null;
                    return callback(error, resultJSON);
                }
                else {
                    whereClause.volunteerId = userId; //2 Return all feedbacks for all events for this user
                }
            }
            else {
                if (userId == -1 || userId == "-1") {
                    whereClause.eventId = eventId; //3 Return all feedbacks for this event
                }
                else {
                    // 4 Return feedback for this user for this event
                    whereClause.volunteerId = userId;
                    whereClause.eventId = eventId;
                }
            }

            // make a call to API
            try {
                API.getFeedback(whereClause, function (error, data) {
                    resultJSON.data.push(data);
                    resultJSON.forceLogout = false;
                    resultJSON.error = error;
                    return callback(error, resultJSON);
                });

            }
            catch (exception) {
                resultJSON.data = [];
                resultJSON.forceLogout = false;
                resultJSON.error = errHandler.handleException(exception);
                return callback(exception, resultJSON);
            }
        }





    },

    test: function (cb) {
        provider.sendNotification(1,"yesssss",function(error,data){
            console.log(data);
             cb(null, { testcall: data });
        });
        

    },
};


/**
 * this method is used to Check the Token Validity by ALL conditions:
 * - token NOt EMPTY
 * - token belongs to Active User Sessions
 * @param {string} token 
 * @param {function} cb 
 */
function checkTokenValidity(token, cb) {

    if (utility.IsNullOrEmpty(token) || token == undefined) {
        let errorMessage = errHandler.INVALID_TOKEN + ":" + errHandler.TOKEN_MISSING;
        cb(errorMessage, 0);
        return false;
    }
    let userID = sessions.checkForActiveSession(token);
    if (!userID) // not found
    {
        let errorMessage = errHandler.INVALID_TOKEN + ":" + errHandler.NO_ACTIVE_SESSION;
        cb(errorMessage, 0);
        return false;
    }
    else {
        cb(null, userID);
        return true;
    }

}

function checkTokenValidityForImageUpload(token, cb) {

    if (utility.IsNullOrEmpty(token) || token == undefined) {
        let errorMessage = errHandler.INVALID_TOKEN + ":" + errHandler.TOKEN_MISSING;
        cb(errorMessage, 0);
        return false;
    }
    else if (token != "qweerttryiuXDS34") {
        let errorMessage = errHandler.INVALID_TOKEN;
        cb(errorMessage, 0);
        return false;
    }
    else {
        cb(null, true);
        return true;
    }

}

function raiseInvalidTokenException(resultJSON, msg) {
    let exc = new Error(msg);
    resultJSON.data = [];
    resultJSON.forceLogout = true;
    resultJSON.error = errHandler.handleException(exc);
    return resultJSON;
};

function raiseInvalidEventParamsException(resultJSON, msg) {
    let exc = new Error(msg);
    resultJSON.data = [];
    resultJSON.forceLogout = false;
    resultJSON.error = errHandler.handleException(exc);
    return resultJSON;
};

/**
 * function used to check whtehr the timeslots entered by user
 * are within the event timelines or not. 
 * @param {ISO Datetime string} eventStartDtTm 
 * @param {ISO Datetime string} eventEndDtTm 
 * @param {ISO Datetime string} inputStartDtTm 
 * @param {ISO Datetime string} inputEndDtTm 
 */
function verifyTimeSlots(eventStartDtTm, eventEndDtTm, inputStartDtTm, inputEndDtTm) {

    // evenSTart<=inputStart<=eventEnd
    if (utility.DateCompare(eventStartDtTm, false, inputStartDtTm)
        && utility.DateCompare(inputStartDtTm, false, eventEndDtTm)) {

        // eventStrt<=inputEnd<=eventEnd
        if (utility.DateCompare(eventStartDtTm, false, inputEndDtTm)
            && utility.DateCompare(inputEndDtTm, false, eventEndDtTm)) {

            if (utility.DateCompare(inputStartDtTm, false, inputEndDtTm)) {
                return true;
            }
            else {
                throw new Error("The input Start Time is after the End Time.");
            }

        }
        else {
            throw new Error("EndTime provided is not within event schedule.");
        }

    }
    else {
        throw new Error("StartTime provided is not within event schedule.");
    }
    return result;
}

/**
 * this method is used to upload the file onto storage location and return the stored filepath.(relative)
 * it performs the checks for file being an IMAGE.
 * @param {object} file 
 * @param {function} cb callback function of type (error,data) 
 */
function uploadFileToStorageLocation(img, cb) {
    if (img) {
        let name = img.hapi.filename;// actual file name
        let filelocation = utility.getCurrDtTm() + name;// to avoid duplicity of names
        // let path = pathLib.join(__dirname, "../files/") + filelocation;
        let path = utility.filePath + filelocation;

        if (imageFilter(name) == true) { // if input file is an image (just checking extension)

            let file = fs.createWriteStream(path); // save the file to local storage

            file.on('error', function (err) {
                //console.error(err);
                cb(err, null);
            });

            img.pipe(file);

            img.on('end', function (err) {
                if (!err) {
                    cb(null, filelocation);
                }
                else {
                    cb(err, null);
                }
            });
        }
        else {
            cb("not an image file", null);
        }
    }
    else {
        cb(null, null);
    }
}

const imageFilter = function (fileName) {
    // accept image only
    if (!fileName.toString().match(/\.(jpg|jpeg|png|gif)$/)) {
        return false;
    }
    return true;
};