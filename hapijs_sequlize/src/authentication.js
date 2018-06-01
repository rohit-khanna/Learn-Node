'use strict';

const Joi = require('joi');
const Utils = require('./utils/index');
const nodemailer = require('nodemailer');
const modelSchema = require('./model/csrModelsSchema');
const utility = require('./utility');
const models = require('./model/csrModels');
const errHandler = require('./ErrorHandler');
var API = require('./DataAPI')
const sessions = require('./model/activeSessions');

module.exports.authentication = {

    /**
     * This method will be used to create user during registration process.
     * @param {*} userToRegister
     * @param {*} callback
     */
    registerUser: function (userToRegister, callback) {
        let volunteerModelSchema = modelSchema.volunteerModelSchema;

        let results = Joi.validate(userToRegister, Utils.schema.userEntityValidationSchema);
        if (results.error) {
            console.log("Failed Validation!!!!!");
            return callback(null, new models.responseModel(errHandler.VALIDATION_FAILURE, [], false));
        }
        API.registerUser(userToRegister, callback);
    },

    /**
     * method is used to authenticate the user and return  authentication token
     * @param {*} username username of the user
     * @param {*} password encrypted password
     */
    login: function (username, password, isAdmin, deviceUUID, pushToken, platform, callback) {
        var resultJSON = new models.authenticationResultModel();

        try {
            if (utility.IsNullOrEmpty(username) || utility.IsNullOrEmpty(password))
                throw new Error(errHandler.CREDENTIALS_NOT_SUPPLY);

            API.authenticateUser(username.toString().toUpperCase(), password, isAdmin, function (authenticationResult) {
                resultJSON.error = '';
                if (authenticationResult) {

                    API.checkAssociation(username, deviceUUID, function (result) {
                        //result={associationID:'',associatedDeviceUUID=''}
                        if (result) {
                            if (result.associationID == -1) // not found
                            {
                                API.createNewUserDeviceAssociation(authenticationResult.userID, deviceUUID, pushToken, platform, function (registerDeviceResult) {
                                    if (registerDeviceResult) {
                                        resultJSON.token = authenticationResult.token;
                                        resultJSON.userID = null;//authenticationResult.userID;
                                        resultJSON.error = authenticationResult.error;
                                        resultJSON.data = authenticationResult.data;

                                        return callback(authenticationResult.error, resultJSON);
                                    }
                                });
                            }
                            else {  // some association found
                                // do nothing
                                resultJSON.token = authenticationResult.token;
                                resultJSON.userID = null;//authenticationResult.userID;
                                resultJSON.error = authenticationResult.error;
                                resultJSON.data = authenticationResult.data;

                                return callback(authenticationResult.error, resultJSON);
                            }
                        }
                    });
                    /*   API.createNewUserDeviceAssociation(authenticationResult.userID, deviceUUID, pushToken, platform, function (registerDeviceResult) {
                            if (registerDeviceResult) {
                                resultJSON.token = authenticationResult.token;
                                resultJSON.userID = null;//authenticationResult.userID;
                                resultJSON.error = authenticationResult.error;
                                resultJSON.data = authenticationResult.data;
                            }
                        }); */

                    return callback(authenticationResult.error, resultJSON);
                }
            });

        }
        catch (exception) {
            resultJSON.data = '';
            resultJSON.error = errHandler.handleException(exception);
            return callback(null, resultJSON);
        }

    },

    /**
     * this method is used to change the password of the userID associated with the token
     */
    changePassword: function (oldPassword, newPassword, token, callback) {
        let resultJSON = new models.responseModel();

        // verify token
        if (utility.IsNullOrEmpty(token) || token == undefined) {
            let errorMessage = errHandler.INVALID_TOKEN + ":" + errHandler.TOKEN_MISSING;
            resultJSON = raiseException(resultJSON, errorMessage, true);
            callback(errorMessage, resultJSON);
        }
        let userid = sessions.checkForActiveSession(token);

        if (!userid) // not found
        {
            let errorMessage = errHandler.INVALID_TOKEN + ":" + errHandler.NO_ACTIVE_SESSION;
            resultJSON = raiseException(resultJSON, errorMessage, true);
            return callback(errorMessage, resultJSON);  // return
        }

        // verify inputs
        if (utility.IsNullOrEmpty(oldPassword)) {
            let errorMessage = "Specify Old Password";
            resultJSON = raiseException(resultJSON, errorMessage, false);
            return callback(errorMessage, resultJSON);  // return
        }
        if (utility.IsNullOrEmpty(newPassword)) {
            let errorMessage = "Specify New Password";
            resultJSON = raiseException(resultJSON, errorMessage, false);
            return callback(errorMessage, resultJSON);  // return
        }

        API.changePassword(oldPassword, newPassword, userid, function (err, data) {
            resultJSON.error = err;
            console.log(data);
            resultJSON.data.push(data);
            resultJSON.forceLogout = false;
            return callback(err, resultJSON);
        });
    }, // end changePassword

    logout: function (token, callback) {
        let resultJSON = new models.responseModel();

        // verify token
        if (utility.IsNullOrEmpty(token) || token == undefined) {
            let errorMessage = errHandler.INVALID_TOKEN + ":" + errHandler.TOKEN_MISSING;
            resultJSON = raiseException(resultJSON, errorMessage, true);
            callback(errorMessage, resultJSON);
        }
        let userid = sessions.checkForActiveSession(token);

        if (!userid) // not found
        {
            let errorMessage = errHandler.INVALID_TOKEN + ":" + errHandler.NO_ACTIVE_SESSION;
            resultJSON = raiseException(resultJSON, errorMessage, true);
            return callback(errorMessage, resultJSON);  // return
        }

        if (sessions.deleteUserSession(userid)) {
            resultJSON.error = null;
            resultJSON.data.push({ success: true });
            resultJSON.forceLogout = false;
            return callback(null, resultJSON);
        }
        else {
            let error = new Error(errHandler.LOGOUT_ERROR);
            resultJSON.data = '';
            resultJSON.error = errHandler.handleException(error);
            return callback(error, resultJSON);
        }
    }, // end logout

    /**
     * this method is used to update the user profile
     */
    updateProfile: function (token, payload, callback) {
        let resultJSON = new models.responseModel();

        // verify token
        if (utility.IsNullOrEmpty(token) || token == undefined) {
            let errorMessage = errHandler.INVALID_TOKEN + ":" + errHandler.TOKEN_MISSING;
            resultJSON = raiseException(resultJSON, errorMessage, true);
            callback(errorMessage, resultJSON);
        }
        let userid = sessions.checkForActiveSession(token);

        if (!userid) // not found
        {
            let errorMessage = errHandler.INVALID_TOKEN + ":" + errHandler.NO_ACTIVE_SESSION;
            resultJSON = raiseException(resultJSON, errorMessage, true);
            return callback(errorMessage, resultJSON);  // return
        }
        try {
            API.manageUser(userid, payload, function (err, data) {
                resultJSON.error = err;
                console.log(data);
                resultJSON.data.push(data);
                resultJSON.forceLogout = false;
                return callback(err, resultJSON);
            });
        }
        catch (exception) {
            resultJSON.data = '';
            resultJSON.error = errHandler.handleException(exception);
            return callback(null, resultJSON);
        }
    }

};

function raiseException(resultJSON, msg, forceLogout) {
    let exc = new Error(msg);
    resultJSON.data = [];
    resultJSON.forceLogout = forceLogout;
    resultJSON.error = errHandler.handleException(exc);
    return resultJSON;
};






