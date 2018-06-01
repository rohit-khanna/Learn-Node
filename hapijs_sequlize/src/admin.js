'use strict';
const modelSchema = require('./model/csrModelsSchema');
const utility = require('./utility');
const models = require('./model/csrModels');
const errHandler = require('./ErrorHandler');
const sessions = require('./model/activeSessions');
const API = require('./DataAPI');
const Utils = require('./utils/index');
const Joi = require('joi');
const provider = require('./Notification/notificationProvider');

module.exports.admin = {

    /**
     * this method is used to return All requests for volunteering.
     * ALso validates if input user is an ADMIN or not
     * @param {string} token security token
     * @param {BOOLEAN} isPending Bool to return only PENDING or ALL
     * @param {integer} eventId OPTIONAL:event ID
     * @param {function} callback callback function
     */
    getAllRequests: function (token, isPending, eventLocation, eventId, callback) {
        let resultJSON = new models.responseModel();
        //let userID = 0;
        checkTokenValidity(token, function (errMsg, user) {
            // userID = user;
            if (errMsg) {
                resultJSON = raiseInvalidTokenException(resultJSON, errMsg);
                return callback(errMsg, resultJSON);
            }
            else {
                try {
                    API.getAllRequestsForAdmin(isPending, eventId, eventLocation, function (error, data) {
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

        });

    },


    /**
     * This method is used to APprove or Reject a Volunteer Request
     */
    approveRequest: function (token, requestId, isApproved, callback) {
        let resultJSON = new models.responseModel();
        //let userID = 0;
        checkTokenValidity(token, function (errMsg, user) {
            // userID = user;
            if (errMsg) {
                resultJSON = raiseInvalidTokenException(resultJSON, errMsg);
                return callback(errMsg, resultJSON);
            }
            else {
                try {

                    if (utility.IsNullOrEmpty(requestId)) {
                        throw new Error(errHandler.CREDENTIALS_NOT_SUPPLY + ":" + errHandler.INVALID_INPUT_PARAMS);
                    }

                    API.approveRequests(requestId, isApproved, function (error, data) {
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

        });
    },

    /**
     * this method is used to activate or deactivate a user.
     */
    manageUser: function (token, userIdToMaintain, isActivationRequest, callback) {
        let resultJSON = new models.responseModel();
        checkTokenValidity(token, function (errMsg, user) {
            if (errMsg) {
                resultJSON = raiseInvalidTokenException(resultJSON, errMsg);
                return callback(errMsg, resultJSON);
            }
            else {
                try {

                    if (utility.IsNullOrEmpty(userIdToMaintain)) {
                        throw new Error(errHandler.CREDENTIALS_NOT_SUPPLY + ":" + errHandler.INVALID_INPUT_PARAMS);
                    }
                    let dataObject = {};
                    if (isActivationRequest) {
                        dataObject.isActivated = true;
                        dataObject.activationDate = utility.getDateForDB(utility.getCurrDtTm());
                    }
                    else {
                        dataObject.isActivated = false;
                        dataObject.activationDate = null;
                    }


                    API.manageUser(userIdToMaintain, dataObject,
                        function (error, data) {
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

        });
    },

    /**
     * this method is used to fetch list of all users which are registered in the system
     * @param {String} token admin security token
     * @param {String} volunteerType  set S=internal users only, E= External Users Only, A=All Users
     * @param {Boolean} noActivationFilter set A=Activated users only, D= DeActivated Users Only, false=All Users
     * @param {*} callback callback function of typoe (error,data)
     */
    getUserList: function (token, volunteerType, siteLocation, noActivationFilter, callback) {
        let resultJSON = new models.responseModel();
        checkTokenValidity(token, function (errMsg, user) {
            if (errMsg) {
                resultJSON = raiseInvalidTokenException(resultJSON, errMsg);
                return callback(errMsg, resultJSON);
            }
            else {
                try {

                    let volunteerTypeStatus = utility.IsNullOrEmpty(volunteerType) ? "A" : volunteerType.toLocaleUpperCase();

                    let dataObject = { isAdmin: false };  // no admins should be returned
                    if (volunteerTypeStatus == "S") dataObject.isInternal = true;  // fetch only INternal SopraSTeria Users
                    else if (volunteerTypeStatus == "E") dataObject.isInternal = false; // fetch only External users

                    if (noActivationFilter.toString().toLocaleUpperCase() == "A") dataObject.isActivated = true;
                    else if (noActivationFilter.toString().toLocaleUpperCase() == "D") dataObject.isActivated = false;

                    if (siteLocation != "0") {
                        dataObject.SiteLocationId = siteLocation;
                    }

                    API.getUserList(dataObject,
                        function (error, data) {
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

        });
    },

    /**
     * This method is used to CREATE/UPDATE the event .
     * If eventID parameter is provided, its a UPDATE request else CREATE request.
     * This method will 
     *  - validate the input token to be an ADMIN.
     *  - validate the Schema as Event for 'dataPayloadJSONObject' (only IF isRequestToActivateEvent:false)
     * @param {*} eventID null , if CREATE or EventID of event to be UPDATED
     * @param {*} token ADMIN Security Token
     * @param {*} dataPayload JSON Object (when isRequestToActivateEvent:false) else Boolean indicating activation or deactivation of event
     * @param {BOOLEAN} isRequestToActivateEvent request is only for Activation or DE-Activation
     * @param {function} callback callback function
     */
    maintainEvent: function (eventID, token, dataPayload, isRequestToActivateEvent, callback) {

        let resultJSON = new models.responseModel();
        let dataPayloadJSONObject = null;
        checkTokenValidity(token, function (errMsg, user) {
            if (errMsg) {
                resultJSON = raiseInvalidTokenException(resultJSON, errMsg);
                return callback(errMsg, resultJSON);
            }
            else {
                try {

                    dataPayloadJSONObject = dataPayload;
                    if (isRequestToActivateEvent == false || isRequestToActivateEvent == "false") {


                        if (utility.IsNullOrEmpty(dataPayloadJSONObject)) {
                            throw new Error(errHandler.CREDENTIALS_NOT_SUPPLY + ":" + errHandler.INVALID_INPUT_PARAMS + ": data");
                        }
                        let results = Joi.validate(dataPayloadJSONObject, Utils.schema.eventEntityValidationSchema);
                        if (results.error) {
                            console.log("Failed Validation!!!!!");
                            throw new Error(errHandler.VALIDATION_FAILURE);
                        }

                        let isCreateRequest = (!eventID) ? true : false;
                        if (isCreateRequest) {
                            API.createEvent(dataPayloadJSONObject, function (error, data) {
                                provider.sendNotification(null, "New Event Created", function (error, data) {
                                    resultJSON.data.push(data);
                                    resultJSON.forceLogout = false;
                                    resultJSON.error = error;
                                    return callback(error, resultJSON);
                                });

                            });
                        }
                        else {
                            API.updateEvent(eventID, dataPayloadJSONObject, function (error, data) {
                                resultJSON.data.push(data);
                                resultJSON.forceLogout = false;
                                resultJSON.error = error;
                                return callback(error, resultJSON);
                            });
                        }
                    }
                    else {
                        if (!eventID) {
                            throw new Error(errHandler.CREDENTIALS_NOT_SUPPLY + ":" + errHandler.INVALID_INPUT_PARAMS + ": eventID");
                        }
                        let payloadData = {};
                        if (dataPayloadJSONObject == "true" || dataPayloadJSONObject == true) // activation of EVENT
                        {
                            payloadData.isActivated = true;
                            payloadData.activationDate = utility.getDateForDB(utility.getCurrDtTm());
                        }
                        else {
                            payloadData.isActivated = false;
                            payloadData.activationDate = null;
                        }
                        API.updateEvent(eventID, payloadData, function (error, data) {
                            resultJSON.data.push(data);
                            resultJSON.forceLogout = false;
                            resultJSON.error = error;
                            return callback(error, resultJSON);
                        });
                    }
                }
                catch (exception) {
                    resultJSON.data = [];
                    resultJSON.forceLogout = false;
                    resultJSON.error = errHandler.handleException(exception);
                    return callback(exception, resultJSON);
                }
            }

        });
    }

};

/**
 * this method is used to Check the Token Validity by ALL conditions:
 * - token NOt EMPTY
 * - token belongs to Active User Sessions
 * - user associated with the token is ADMIN
 * @param {string} token 
 * @param {function} cb 
 */
function checkTokenValidity(token, cb) {

    if (utility.IsNullOrEmpty(token) || token == undefined) {
        let errorMessage = errHandler.INVALID_TOKEN + ":" + errHandler.TOKEN_MISSING;
        return cb(errorMessage, 0);
    }
    let userID = sessions.checkForActiveSession(token);
    if (!userID) // not found
    {
        let errorMessage = errHandler.INVALID_TOKEN + ":" + errHandler.NO_ACTIVE_SESSION;
        return cb(errorMessage, 0);
    }

    API.getUser(userID, function (error, data) {
        if (data.dataValues == undefined) {
            let errorMessage = errHandler.INVALID_TOKEN + ":" + errHandler.USER_NOT_FOUND + " for token";
            return cb(errorMessage, 0);
        }
        let isAdmin = data.dataValues.isAdmin;
        if (isAdmin == false) {
            let errorMessage = errHandler.INVALID_TOKEN + ":" + errHandler.USER_NOT_AUTHORIZED + " for this operation";
            return cb(errorMessage, 0);
        }
        else {
            return cb(null, userID);
        }
    });
}

function raiseInvalidTokenException(resultJSON, msg) {
    let exc = new Error(msg);
    resultJSON.data = [];
    resultJSON.forceLogout = true;
    resultJSON.error = errHandler.handleException(exc);
    return resultJSON;
};

