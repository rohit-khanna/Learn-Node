/****************************************************************************************
 *    this module exposes the methods which are used to INTERACT with
 *              data Store to fetch the data
 ****************************************************************************************/
const model = require('./model/csrModels');
const sessions = require('./model/activeSessions');
const utility = require('./utility');
const modelSchema = require('./model/csrModelsSchema');
const errHandler = require('./ErrorHandler');
const ut = require('util');

/**
 * this method is used to register a new user
 * @param {*} userToRegister of type volunteerModelSchema
 * @param {*} callback callback function
 */
exports.registerUser = function (userToRegister, callback) {
    let isInternalVolunteer = utility.checkInternalUserEmail(userToRegister.emailId);
    let imgUrl = '';
    let imgUrlThmb = '';

    const pendingText = "You will receive an email notification once ADMIN approves your registration.";
    const loginCredentials = ut.format('Your login credentials are <br><br><b>username:</b>   %s  <br> <b>password:</b>   %s<br>', userToRegister.emailId.toString().toUpperCase(), userToRegister.password);
    const subject = "CSR: New Volunteer Registration";

    if (userToRegister.imgUrl) imgUrl = userToRegister.imgUrl;
    if (userToRegister.imgUrlThmb) imgUrlThmb = userToRegister.imgUrlThmb;

    modelSchema.modelDbSchema.volunteerModelEntity.build({
        forename: userToRegister.forename,
        surname: userToRegister.surname,
        password: userToRegister.password,
        gender: userToRegister.gender,
        emailId: userToRegister.emailId.toString().toUpperCase(),
        selfLocation: userToRegister.selfLocation,
        contactNo: userToRegister.contactNo,
        businessLocation: "",
        //businessLocation: userToRegister.businessLocation,
        SiteLocationId: userToRegister.businessLocation,
        isAdmin: userToRegister.isAdmin,
        imgUrlThmb: imgUrlThmb,
        imgUrl: imgUrl,
        isInternal: isInternalVolunteer,
        isActivated: isInternalVolunteer,
        activationDate: isInternalVolunteer ? utility.getDateForDB(utility.getCurrDtTm()) : null
    }).save().then(newUser => {
        console.log(`New user ${newUser.forename}, with id ${newUser.id} has been created.`);

        let content = ut.format("Hello %s, <br><br>Thanks for Registration. Your registration request status is %s.<br><br><br>",
            userToRegister.forename, isInternalVolunteer == true ? "<b>ACTIVATED</b>" : "<b>PENDING</b>");

        content += isInternalVolunteer == true ? loginCredentials : pendingText;

        utility.sendEmail(userToRegister.emailId.toString(), content, subject, function (error) {
            console.log("mail error:" + error);
            errHandler.logMessage("mail error:" + error, errHandler.LOG_LEVEL.ERROR);
        });

        callback(null, new model.responseModel(null, [{
            "activated": isInternalVolunteer,
            "success": true
        }], false));



    }).catch((err => {
        console.log('Unable to register the user:', err);
        callback(err, new model.responseModel(err.errors[0].message, [], false));
    }));
};



/**  
method is used to 
    1. get the  CSR events from Data store as per filter params
        if isAllEventRequest1.  1.	Null : All active and deactivated events
                                2.	True: Active event
                                3.	False : Deactivated event

    2. return events as JSON Array using Callback
*/
exports.getCSREvents = function (startDtTm, endDtTm, siteLocation, isAllEventRequest, cb) {

    let whereClause = {
        startDtTm: { $gte: utility.getDateForDB(startDtTm) },
        endDtTm: { $lte: utility.getDateForDB(endDtTm) }
    };


    if (siteLocation != "0") {
        whereClause.SiteLocationId = siteLocation;
    }

    if (isAllEventRequest == "true") {
        whereClause.isActivated = true;
    } else if (isAllEventRequest == "false") {
        whereClause.isActivated = false;
    } else if (isAllEventRequest == null) {
        // do nothing
    }

    modelSchema.modelDbSchema.eventsModelEntity.findAll({
        include: [{
            model: modelSchema.modelDbSchema.eventLocationEntity,
            attributes: ['id', 'name']
        }],
        where: whereClause,
        order: [['startDtTm', 'ASC']],
        attributes: ['id', 'eventName', 'eventDescription', 'eventLocation', 'startDtTm', 'endDtTm', 'eventAddress', 'isActivated']
    })
        .then(events => {
            cb(null, events);
        }).catch((err => {
            console.log('Unable to fetch details:', err);
            cb(err, []);
        }));



};



/**  
method is used to 
1. get the CSR events details for the event ID
2. return JSON Data as callback
*/
exports.getEventDetails = function (eventID, cb) {
    modelSchema.modelDbSchema.eventsModelEntity.findById(eventID)
        .then(event => {
            if (event)
                cb(null, event);
            else
                cb(errHandler.NO_EVENT_FOUND, { dataValues: null })
        }).catch((err => {
            console.log('Unable to fetch details:', err);
            cb(err, []);
        }));
};

/**
 * this method is used to 
 *  1. Check for a Valid User using the username , password, isAdmin
 *  2. generate a security token and associate this token with userID and add to serverDictionary
 *  3. return token & userID 
 */
exports.authenticateUser = function (username, password, isAdmin, cb) {
    var result = { userID: '', token: '', error: null, data: null };

    //1.  Call Database to Check If User Exists and fetch userID
    /**
     * NOTE:
     * We can also think of first make a hit to active session Dict to find whether user was ever authenticated
     * but then it may be improper as at backend password was changed . So making DB call was thought of.
     */
    let userID = null;
    modelSchema.modelDbSchema.volunteerModelEntity.findOne({
        where: { emailId: username, isAdmin: isAdmin },
        attributes: ['password', 'id', 'isAdmin', 'isInternal', 'isActivated', 'forename', 'surname', 'emailId', 'imgUrl', 'imgUrlThmb']
    }).then(user => {
        if (user) {// user found
            userID = user.dataValues.password == password ? user.dataValues.id : null;

            if (userID)// user is found
            {
                if (user.dataValues.isActivated == false) // not activated user
                {
                    throw new Error(errHandler.USER_NOT_ACTIVE);
                }
            }
        }
        else { // not found
            //console.log('Not found' + user);
            userID = null;
        }
        console.log("userID-" + userID);

        if (userID) { // user FOUND
            //2.
            var token = sessions.getUserSession(userID);  // undefined if not found
            console.log('token:' + token);
            if (token == undefined || token == null) // session not found
            {
                console.log('creating new session');
                token = sessions.getToken();
                sessions.setUserSession(userID, token); // create Active Session 
                console.log('session:' + sessions.getUserSession(userID));
                result.token = token;
                result.userID = null;// userID;   intentionally commednted out as it was not used on UI
                result.data = {
                    forename: user.dataValues.forename,
                    surname: user.dataValues.surname,
                    emailId: user.dataValues.emailId,
                    imgUrl: user.dataValues.imgUrl,
                    imgUrlThmb: user.dataValues.imgUrlThmb
                };
                cb(result);
            }
            else {
                console.log('token found:' + token);
                result.token = token;
                result.userID = null;// userID;   intentionally commented out as it was not used on UI
                result.data = {
                    forename: user.dataValues.forename,
                    surname: user.dataValues.surname,
                    emailId: user.dataValues.emailId,
                    imgUrl: user.dataValues.imgUrl,
                    imgUrlThmb: user.dataValues.imgUrlThmb
                };
                cb(result);
            }
        }
        else {
            throw new Error(errHandler.USER_NOT_AUTHORIZED);
        }
    }).catch((err => {
        console.log('Unable to Logon user:', err.message);
        result.token = null;
        result.userID = null;
        result.error = errHandler.handleException(err);
        cb(result);
    }
    ));

};

/**
 * This method is used to register the device after the successful login.
 * It stores the deviceUUID,pushToken and Platform (Android/iOs) for the device 
 * mapped with volunteerID and then use Sequlize.update to update the field.
 * @param {String} volunteerId
 * @param {String} deviceUUID
 * @param {String} pushToken
 * @param {String} platform
 * @param {String} cb
 */

exports.createNewUserDeviceAssociation = function (volunteerId, deviceUUID, pushToken, platform, cb) {

    modelSchema.modelDbSchema.deviceRegistrationEntity.build({
        volunteerId: volunteerId,
        deviceUUID: deviceUUID,
        pushToken: pushToken,
        Platform: platform
    }).save().then(newDevice => {
        console.log(`New Device  with id ${newDevice.id} has been created.`);
        cb(null, { success: true });
        // .find({where:{volunteerId:volunteerId}}).then(matchedResult =>{
        //     modelSchema.modelDbSchema.deviceRegistarionSchema
        //     .update({
        //         deviceUUID: deviceUUID,
        //         pushToken:pushToken,
        //         platform:platform
        //     },
        //     {
        //         where: { volunteerId:volunteerId}
        //     })
        //     .then(updatedRows => {
        //         if (updatedRows && updatedRows.length == 1) {
        //             cb(null, { success: true })
        //         }
        //         else {
        //             console.log(errHandler.ERROR_ON_UPDATE);
        //             throw new Error(errHandler.ERROR_ON_UPDATE);
        //         }
        //     });
        // })
    }).catch((err => {
        console.log('Unable to add device:', err);
        cb(errHandler.handleException(err), [{
            success: false
        }]);
    }));
}



/**
 * check if the user exist for that deviceUUID
 * @param {Integer} userID 
 * @param {Integer} deviceUUID
 * @param {function} cb callback function of type (data)
 */
exports.checkAssociation = function (userID, deviceUUID, cb) {

    modelSchema.modelDbSchema.deviceRegistrationEntity
        .findAll({ where: { volunteerId: userID, deviceUUID: deviceUUID } })
        .then(found => {
            if (found) {
                cb({ associationID: '', associatedDeviceUUID: '' });
            }
            else cb({ associationID: -1, associatedDeviceUUID: -1 });
        })
        .catch(err => {
            cb({ associationID: -1, associatedDeviceUUID: -1 });
        })
};

/**
 * This method is used to change the password for the user.
 * It first finds the User Entity using the UserID and Old pwd
 *  and then uses Sequelize.update to update the field. 
 * @param {string} oldpwd 
 * @param {string} newpwd 
 * @param {string} userid 
 * @param {function} cb 
 */
exports.changePassword = function (oldpwd, newpwd, userid, cb) {

    modelSchema.modelDbSchema.volunteerModelEntity

        // find a valid user using userID+ provided old pwd
        .find({ where: { id: userid, password: oldpwd } })
        .then(matchedResult => {
            if (!matchedResult) {// not found user using userID+ provided old pwd
                console.log(errHandler.INCORRECT_OLD_PASSWORD);
                throw new Error(errHandler.INCORRECT_OLD_PASSWORD);
            }
            else {
                modelSchema.modelDbSchema.volunteerModelEntity
                    .update({
                        password: newpwd
                    },
                    {
                        where: { id: userid, password: oldpwd }
                    })
                    .then(updatedRows => {
                        if (updatedRows && updatedRows.length == 1) {
                            cb(null, { success: true })
                        }
                        else {
                            console.log(errHandler.ERROR_ON_UPDATE);
                            throw new Error(errHandler.ERROR_ON_UPDATE);
                        }
                    });
            }
        }).catch(err => {
            console.log("Update Error.DATA-API.changepwd");
            cb(errHandler.handleException(err), null)
        });


};

exports.AddVolunteerRequest = function (event, userID, startDtTm, endDtTm, requestStatus, cb) {
    event.createVolunteerEvent({
        volunteerId: userID,
        eventId: event.dataValues.id,
        startDtTm: utility.getDateForDB(startDtTm),
        endDtTm: utility.getDateForDB(endDtTm),
        requestStatus: requestStatus
    }).then(createdRecord => {
        if (createdRecord) {
            console.log(createdRecord);
            cb(null, {
                success: true,
                approvalStatus: createdRecord.dataValues.requestStatus,
                message: 'Your Request is ' + createdRecord.dataValues.requestStatus
            });
        }
        else {
            throw new Error("Save unsuccessfull");
        }
    }).catch(err => {
        console.log('Unable to Add:', err);
        cb(err, []);
    });
};

/**
 * This function is used to fetch the details of the User.
 * @param {integer} userID : user primary key
 * @param {function}: callback
 */
exports.getUser = function (userID, cb) {
    modelSchema.modelDbSchema.volunteerModelEntity.findById(userID)
        .then(user => {
            if (user)
                cb(null, user);
            else
                cb(errHandler.USER_NOT_FOUND, { dataValues: null })
        }).catch((err => {
            console.log('Unable to fetch details:', err);
            cb(err, []);
        }));
};

/**
 * this method is used to fetch the volunteer request for the user.
 * EventId is an optional parameter here. If provided, user will be returned
 * all the request by user for that event.
 * @param {integer} userID userID of loggedIn User
 * @param {integer} eventId Optional Event ID
 * @param {function} cb callback function
 */
exports.getUserRequests = function (userID, eventId, cb) {
    let whereClause = {
        volunteerId: userID
    };

    if (eventId) {
        whereClause.eventId = eventId;
    }

    modelSchema.modelDbSchema.volunteerEventEntity.findAll({
        include: [{
            model: modelSchema.modelDbSchema.eventsModelEntity.findAll({
                include: [{
                    model: modelSchema.modelDbSchema.eventLocationEntity
                }]
            })
        }],
        where: whereClause,
    })
        .then(result => {
            console.log(result);
            cb(null, result);
        }).catch(err => {
            console.log("error:" + errHandler);
            cb(err, null);
        });

};

exports.getUserRequestsById = function (requestId, cb) {
    findUserRequestsById(requestId, cb);
};

/**
 * returns all Volunteering requests
 * @param {Boolean} pendingOnly 
 * @param {int} eventId 
 * @param {function} cb callback (error,data)
 */
exports.getAllRequestsForAdmin = function (pendingOnly, eventLocation, eventId, cb) {
    let whereClause = {};

    if (eventId) {
        whereClause.eventId = eventId;
    }
    if (pendingOnly) {
        whereClause.requestStatus = "PENDING";
    }

    if (eventLocation) {
        whereClause.eventLocation = eventLocation;
    }

    modelSchema.modelDbSchema.volunteerEventEntity.findAll({
        include: [{
            model: modelSchema.modelDbSchema.eventsModelEntity.findAll({
                include: [{
                    model: modelSchema.modelDbSchema.eventLocationEntity
                }]
            })
        },
        {
            model: modelSchema.modelDbSchema.volunteerModelEntity
        }],
        where: whereClause
    })
        .then(result => {
            console.log(result);
            cb(null, result);
        }).catch(err => {
            console.log("error:" + errHandler);
            cb(err, null);
        });
};

exports.getLocations = function (cb) {
    modelSchema.modelDbSchema.eventLocationEntity.findAll({
        attributes: ['id', 'name'],
    })
        .then(results => {
            cb(null, results)
        })
        .catch(err => {
            console.log("Select Error.DATA-API.getLocations");
            cb(errHandler.handleException(err), []);
        });
};

/**
 * check if the event exist for that event ID
 * @param {Integer} eventId 
 * @param {function} cb callback function of type (data)
 */
exports.checkForEventExistence = function (eventId, cb) {

    modelSchema.modelDbSchema.eventsModelEntity
        .findOne({ where: { id: eventId } })
        .then(found => {
            if (found) {
                cb(true);
            }
            else cb(false);
        })
        .catch(err => {
            cb(false);
        })
};

/**
 * this method is used to return the feedbacks as per where clause
 * @param {object} whereClause 
 * @param {function} cb  callback function of typr (error,data)
 */
exports.getFeedback = function (whereClause, cb) {
    modelSchema.modelDbSchema.eventFeedbackEntity
        .findAll({
            where: whereClause,
            attributes: ['id', 'rating', 'description', 'imgUrl1', 'imgUrl2', 'createdAt'],
            include: [{
                model: modelSchema.modelDbSchema.eventsModelEntity,
                attributes: ['eventName', 'eventDescription', 'startDtTm', 'endDtTm']
            },
            {
                model: modelSchema.modelDbSchema.volunteerModelEntity,
                attributes: ['forename', 'surname', 'emailId']
            }]
        })
        .then(results => {
            cb(null, results);
        })
        .catch(error => {
            cb(error, null);
        });
};


/**
 * This method is used to approve or reject a User request to Volunteer for an event.
 * @param {Integer} requestId  Primary Key of the VolunteerEvents
 * @param {BOOLEAN} isApproved if True: Status-> APPROVED else REJECTED
 */
exports.approveRequests = function (requestId, isApproved, cb) {
    let newStatus = isApproved ? "APPROVED" : "REJECTED";
    const subject = "CSR: Volunteer Request Status : Update";
    modelSchema.modelDbSchema.volunteerEventEntity
        .findById(requestId)
        .then(matchedResult => {
            if (!matchedResult) {// not found user using requestID provided 
                console.log(errHandler.REQUEST_NOT_FOUND);
                throw new Error(errHandler.REQUEST_NOT_FOUND);
            }
            else {
                matchedResult
                    .update({
                        requestStatus: newStatus
                    })
                    .then(updatedRows => {
                        if (updatedRows) {
                            sendEmailForRequestStatus(updatedRows.id, updatedRows.requestStatus, subject);
                            cb(null, { success: true })
                        }
                        else {
                            console.log(errHandler.ERROR_ON_UPDATE);
                            throw new Error(errHandler.ERROR_ON_UPDATE);
                        }
                    });
            }
        }).catch(err => {
            console.log('Unable to Update Status:', err);
            cb(err, []);
        });
};




/**
 * this method will be used to manage the user for input userID.
 * @param {INT} userid prinary key for the user to modify
 * @param {Object} changedParamObject contains a JSON object of all the volunteer table attributes 
 * that require a modification This should look like 
 * { forename:'new name', 
 *   surname:'new surname',
 *   isActivated:true,   AND SO On..
 * }
 * @param {function} cb call back function (error,data)
 */
exports.manageUser = function (userid, changedParamObject, cb) {

    const subject = "CSR: Volunteer Registration : Update";
    modelSchema.modelDbSchema.volunteerModelEntity
        // find a valid user using userID
        .findById(userid)
        .then(matchedResult => {
            if (!matchedResult) {// not found user using userID
                console.log(errHandler.USER_NOT_FOUND);
                throw new Error(errHandler.USER_NOT_FOUND);
            }
            else {
                matchedResult
                    .update(changedParamObject)
                    .then(updatedRows => {
                        if (updatedRows) {

                            if (changedParamObject.isActivated)// provided
                            {
                                utility.sendEmail(updatedRows.emailId, ut.format("Hello %s, <br><br> Your profile status have been changed.", updatedRows.forename), subject, function (err) {
                                    if (err) console.log("error sending email");
                                });
                            }
                            cb(null, { success: true })
                        }
                        else {
                            console.log(errHandler.ERROR_ON_UPDATE);
                            throw new Error(errHandler.ERROR_ON_UPDATE);
                        }
                    });
            }
        }).catch(err => {
            console.log("Update Error.DATA-API.maintainUser");
            cb(errHandler.handleException(err), []);
        });
};

/**
 * CREATE a new EVENT:   Activated=false
 * @param {JSON} dataPayloadJSONObject : json object containig the attributes
 * @param {*} cb callback function
 */
exports.createEvent = function (dataPayloadJSONObject, cb) {

    modelSchema.modelDbSchema.eventsModelEntity.build({
        eventName: dataPayloadJSONObject.eventName,
        eventDescription: dataPayloadJSONObject.eventDescription,
        // eventLocation: dataPayloadJSONObject.eventLocation,
        SiteLocationId: dataPayloadJSONObject.eventLocation,
        startDtTm: utility.getDateForDB(dataPayloadJSONObject.startDtTm),
        endDtTm: utility.getDateForDB(dataPayloadJSONObject.endDtTm),
        imgUrlThmb: utility.IsNullOrEmpty(dataPayloadJSONObject.imgUrlThmb) ? "" : dataPayloadJSONObject.imgUrlThmb,
        imgUrl: utility.IsNullOrEmpty(dataPayloadJSONObject.imgUrl) ? "" : dataPayloadJSONObject.imgUrl,
        contactNumber: dataPayloadJSONObject.contactNumber,
        contactPerson: dataPayloadJSONObject.contactPerson,
        eventAddress: dataPayloadJSONObject.eventAddress,
        isActivated: false,
        activationDate: null
    }).save().then(newEvent => {
        console.log(`New EVENT  with id ${newEvent.id} has been created.`);
        cb(null, { success: true })
    }).catch((err => {
        console.log('Unable to create event:', err);
        cb(errHandler.handleException(err), []);
    }));
};

/**
 * UPDATE an event
 * @param {INT} eventID eventID
 * @param {JSON} dataPayloadJSONObject data to update
 * @param {function} cb callback function
 */
exports.updateEvent = function (eventID, dataPayloadJSONObject, cb) {

    if (dataPayloadJSONObject.endDtTm) {
        dataPayloadJSONObject.endDtTm = utility.getDateForDB(dataPayloadJSONObject.endDtTm);
    }

    if (dataPayloadJSONObject.startDtTm) {
        dataPayloadJSONObject.startDtTm = utility.getDateForDB(dataPayloadJSONObject.startDtTm);
    }
    modelSchema.modelDbSchema.eventsModelEntity
        .findById(eventID)
        .then(matchedResult => {
            if (!matchedResult) {// not found event using ID
                console.log(errHandler.NO_EVENT_FOUND);
                throw new Error(errHandler.NO_EVENT_FOUND);
            }
            else {
                matchedResult
                    .update(dataPayloadJSONObject)
                    .then(updatedRows => {
                        if (updatedRows) {
                            cb(null, { success: true })
                        }
                        else {
                            console.log(errHandler.ERROR_ON_UPDATE);
                            throw new Error(errHandler.ERROR_ON_UPDATE);
                        }
                    });
            }
        }).catch(err => {
            console.log("Update Error.DATA-API.update Event");
            cb(errHandler.handleException(err), []);
        });
};




    /**
     * this method is used to fetch the users
     * @param {object} whereClause  where clause JSON Object
     * @param {*} cb callback function
     */
    exports.getUserList = function (whereClause, cb) {
        modelSchema.modelDbSchema.volunteerModelEntity
            .findAll({
                include: [{
                    model: modelSchema.modelDbSchema.eventLocationEntity,
                    attributes: ['id', 'name']
                }],
                where: whereClause,
                order: [['updatedAt', 'DESC']]
            })
            .then(results => {
                cb(null, results)
            })
            .catch(err => {
                console.log("Select Error.DATA-API.getUserList");
                cb(errHandler.handleException(err), []);
            });
    };

    /**
     * this method is used to manage the event feedback
     * @param {Integer} feedbackId 
     * @param {JSON} dataPayloadJSONObject 
     * @param {function} cb  callback function of type (error,data)
     */
    exports.ManageEventFeedback = function (feedbackId, dataPayloadJSONObject, cb) {
        if (feedbackId == 0 || feedbackId == "0") {  // create request
            createEventFeedback(dataPayloadJSONObject, cb);
        }
        else  // update request
        {
            updateEventFeedback(feedbackId, dataPayloadJSONObject, cb);
        }
    };

    exports.getActiveDevicesToNotify = function (singelUserID, cb) {
        let whereClause = {};
        if (singelUserID) // not null
        {
            whereClause.volunteerId = singelUserID;
        }
        modelSchema.modelDbSchema.deviceRegistrationEntity
            .findAll({
                where: whereClause,
                attributes: ['platform', 'pushtoken']
            })
            .then(function (results) {
                if (results) {
                    cb(null, results)
                }
            })
            .catch(err => {
                console.log('Unable to fetch:', err);
                cb(err, []);
            })

    };


    /**
     * this method is used to create a new event feedback
     * @param {*} dataPayloadJSONObject 
     * @param {*} cb 
     */
    function createEventFeedback(dataPayloadJSONObject, cb) {
        modelSchema.modelDbSchema.eventFeedbackEntity.build({
            rating: dataPayloadJSONObject.rating,
            description: dataPayloadJSONObject.description,
            imgUrl1: dataPayloadJSONObject.imgUrl1,
            imgUrl2: dataPayloadJSONObject.imgUrl2,
            eventId: dataPayloadJSONObject.eventId,
            volunteerId: dataPayloadJSONObject.volunteerId,
            isActivated: true,
            activationDate: utility.getDateForDB(utility.getCurrDtTm())
        }).save().then(newFeedback => {

            cb(null, [{ "success": true }]);

        }).catch((err => {
            console.log('Unable to save feedback:', err);
            cb(err, []);
        }));
    }

    /**
     * this method is used to create a new event feedback
     * @param {*} dataPayloadJSONObject 
     * @param {*} cb 
     */
    function updateEventFeedback(feedbackId, dataPayloadJSONObject, cb) {
        modelSchema.modelDbSchema.eventFeedbackEntity
            .findById(feedbackId)
            .then(matchedRecord => {
                if (!matchedRecord) {// not found  using ID
                    throw new Error(errHandler.NO_FEEDBACK_FOUND);
                }
                else {
                    matchedRecord
                        .update(dataPayloadJSONObject)
                        .then(updated => {
                            if (updated) {
                                cb(null, { success: true })
                            }
                            else {
                                throw new Error(errHandler.ERROR_ON_UPDATE);
                            }
                        });
                }
            })
            .catch(error => {
                cb(errHandler.handleException(error), []);
            });
    };



    function sendEmailForRequestStatus(requestId, requestStatus, subject) {

        // fetch event Name and VolunteerName using requestID
        findUserRequestsById(requestId, function (error, data) {
            if (data) {
                let username = data.volunteer.forename;
                let emailId = data.volunteer.emailId;
                let eventname = data.event.eventName;

                utility.sendEmail(emailId,
                    ut.format("Hello %s, <br><br> Your request for volunteering for the event <b>%s</b> has been <b>%s</b>.", username, eventname, requestStatus), subject, function (err) {
                        if (err) console.log("error sending email");
                    });
            }
        });



    }




    function findUserRequestsById(requestId, cb) {
        modelSchema.modelDbSchema.volunteerEventEntity.find({
            include: [{
                model: modelSchema.modelDbSchema.eventsModelEntity,
                attributes: ['id', 'eventName', 'eventDescription']
            },
            {
                model: modelSchema.modelDbSchema.volunteerModelEntity,
                attributes: ['id', 'forename', 'surname', 'emailId']
            }],
            where: { id: requestId }
        })
            .then(result => {
                console.log(result);
                cb(null, result);
            }).catch(err => {
                console.log("error:" + errHandler);
                cb(err, null);
            });
    }

