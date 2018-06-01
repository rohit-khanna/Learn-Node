'use strict';
const Hapi = require('hapi');
const Inert = require('inert');
const modelSchema = require('./src/model/csrModelsSchema').modelDbSchema;
const utility = require('./src/utility');
let port = process.env.PORT || 3005;
let sequelize;
const authent = require('./src/authentication').authentication;
const event = require('./src/events').events;
const admin = require('./src/admin').admin;

module.exports.start = start;

function start(options) {

    sequelize = options.sequelize;
    modelSchema.sequelize = sequelize;

    modelSchema.setupDBModels(function (err) {
        if (!err) {
            startService(options);
        }
    });
};

function startService(config) {

    const server = new Hapi.Server();

    server.connection({
        port: port,
        host: 'localhost',
        compression: false
    });

    server.route({
        method: 'POST',
        path: '/authent/register',
        handler: function (request, reply) {
            logThis('register', request);
            let payload = request.payload;
            let output = authent.registerUser(payload, function (error, output) {
                logOutputAndReturn(output); reply(output);
            });

        }
    });

    server.route({
        method: 'POST',
        path: '/authent/login',
        handler: function (request, reply) {
            logThis('login', request);
            let payload = request.payload;
            console.log(payload.deviceUUID);
            console.log(payload.pushToken);
            console.log(payload.platform);

            let output = authent.login(payload.username, payload.password, payload.isAdmin, payload.deviceUUID, payload.pushToken, payload.platform,
                function (error, output) {
                    logOutputAndReturn(output); reply(output);
                });

        }
    });

    server.route({
        method: 'GET',
        path: '/events/getEventsList/{isFutureEvent}/{dateTimeStamp}/{token}/{siteLocation}/{isAllEventRequest?}',
        handler: function (request, reply) {
            logThis('getEventsList', request);
            let queryParam = request.params;
            let paramSiteLocation = (request.params.siteLocation);
            let paramIsAllEventRequest = (request.params.isAllEventRequest);
            let output = event.getEvents(queryParam.token, queryParam.isFutureEvent,
                queryParam.dateTimeStamp, paramSiteLocation,paramIsAllEventRequest, function (error, output) {
                    logOutputAndReturn(output); reply(output);
                });

        }
    });

    server.route({
        method: 'GET',
        path: '/events/getEvent/{eventID}/{token}',
        handler: function (request, reply) {
            logThis('getEvent', request);
            let queryParam = request.params;
            let output = event.getEventDetails(queryParam.eventID, queryParam.token, function (error, output) {
                logOutputAndReturn(output); reply(output);
            });

        }
    });

    server.route({
        method: 'POST',
        path: '/user/changePassword',
        handler: function (request, reply) {
            logThis('changepassword', request);
            let payload = request.payload;
            let output = authent.changePassword(payload.oldpassword, payload.newpassword,
                payload.token, function (error, output) {
                    logOutputAndReturn(output); reply(output);
                });

        }
    });

    server.route({
        method: 'POST',
        path: '/authent/logout',
        handler: function (request, reply) {
            logThis('logout', request);
            let payload = request.payload;
            let output = authent.logout(payload.token, function (error, output) {
                logOutputAndReturn(output); reply(output);
            });

        }
    });

    server.route({
        method: 'POST',
        path: '/user/submitrequest',
        handler: function (request, reply) {
            logThis('submitRequest', request);
            let payload = request.payload;
            let output = event.submitTimeSlot(payload.eventid, payload.startDtTm, payload.endDtTm,
                payload.token, function (error, output) {
                    logOutputAndReturn(output); reply(output);
                });

        }
    });

    server.route({
        method: 'GET',
        path: '/user/getRequestHistory/{token}/{eventID?}',
        handler: function (request, reply) {
            logThis('getRequestHistory', request);
            let queryParamToken = request.params.token;
            let queryParamEventID = (request.params.eventID) ? request.params.eventID : null;
            let output = event.getRequestHistory(queryParamToken, queryParamEventID,
                function (error, output) {
                    logOutputAndReturn(output); reply(output);
                });

        }
    });

    server.route({
        method: 'GET',
        path: '/user/getUserDetails/{token}/{userId?}',
        handler: function (request, reply) {
            logThis('getUserDetails', request);
            let queryParamToken = request.params.token;
            let queryParamUserID = (request.params.userId) ? request.params.userId : null;
            let output = event.getUserDetails(queryParamToken, queryParamUserID,
                function (error, output) {
                    logOutputAndReturn(output); reply(output);
                });

        }
    });

    server.route({
        method: 'GET',
        path: '/admin/getAllRequests/{token}/{isPending}/{eventLocation}/{eventID?}',
        handler: function (request, reply) {
            logThis('getAllRequests', request);
            let queryParamToken = request.params.token;
            let queryParamIsPending = (request.params.isPending == true || request.params.isPending == "true") ? true : false;
            let queryParamEventID = (request.params.eventID) ? request.params.eventID : null;
            let queryParamEventLocation = (request.params.eventLocation) ? request.params.eventLocation : null;
            let output = admin.getAllRequests(queryParamToken, queryParamIsPending,
                queryParamEventID, queryParamEventLocation, function (error, output) {
                    logOutputAndReturn(output); reply(output);
                });

        }
    });

    server.route({
        method: 'POST',
        path: '/admin/approveRequests',
        handler: function (request, reply) {
            logThis('approveRequests', request);
            let payload = request.payload;
            let output = admin.approveRequest(payload.token, payload.requestId, payload.isApproved,
                function (error, output) {
                    logOutputAndReturn(output); reply(output);
                });

        }
    });

    server.route({
        method: 'POST',
        path: '/admin/manageuser',
        handler: function (request, reply) {
            logThis('manageuser', request);
            let payload = request.payload;
            let output = admin.manageUser(payload.token, payload.userId, payload.isActivateRequest,
                function (error, output) {
                    logOutputAndReturn(output); reply(output);
                });

        }
    });

    server.route({
        method: 'POST',
        path: '/user/updateProfile',
        handler: function (request, reply) {
            logThis('updateProfile', request);
            let payload = request.payload;
            let output = authent.updateProfile(payload.token, payload.data, function (error, output) {
                logOutputAndReturn(output); reply(output);
            });

        }
    });

    server.route({
        method: 'POST',
        path: '/admin/maintainEvent',
        handler: function (request, reply) {
            logThis('maintainEvent', request);

            let payloadEventID = request.payload.eventID;
            let payloadData = request.payload.data;
            let payloadToken = request.payload.token;

            let output = admin.maintainEvent(payloadEventID, payloadToken, payloadData, false,
                function (error, output) {
                    logOutputAndReturn(output); reply(output);
                });

        }
    });

    server.route({
        method: 'POST',
        path: '/admin/activateEvent',
        handler: function (request, reply) {
            logThis('activateEvent', request);

            let payloadEventID = request.payload.eventID;
            let payloadData = request.payload.isActivateRequest;
            let payloadToken = request.payload.token;

            let output = admin.maintainEvent(payloadEventID, payloadToken, payloadData, true,
                function (error, output) {
                    logOutputAndReturn(output); reply(output);
                });

        }
    });

    server.route({
        method: 'GET',
        path: '/admin/getuserlist/{token}/{volunteerType}/{siteLocation}/{noActivationFilter?}',
        handler: function (request, reply) {
            logThis('getuserlist', request);
            let queryParamToken = request.params.token;
            let queryParamVolunteerType = request.params.volunteerType;
            let queryParamSiteLocation = request.params.siteLocation;
            let queryParamNoActivationFilter = (request.params.noActivationFilter) ? request.params.noActivationFilter : false;
            let output = admin.getUserList(queryParamToken, queryParamVolunteerType, queryParamSiteLocation, queryParamNoActivationFilter,
                function (error, output) {
                    logOutputAndReturn(output); reply(output);
                });

        }
    });

    server.route({
        method: 'GET',
        path: '/test/test',
        handler: function (request, reply) {
            event.test(function (err, op) {
                reply(op);
            });

        }
    });


    server.route({
        method: 'GET',
        path: '/test1/test1',
        handler: function (request, reply) {
            let op = "success it is ";
            reply(op + "/" + utility.filePath);
        }
    });


    /**
     * The default handler for our API
     */
    server.route({
        method: 'GET',
        path: '/',
        handler: function (request, reply) {
            reply.file('index.html');
        }
    });



    /**
     * Handler for Location Array for registraion
     */
    server.route({
        method: 'GET',
        path: '/getLocations',
        handler: function (request, reply) {
            // let locations = ['NOIDA-1', 'NOIDA-3', 'CHENNAI', 'PUNE', 'BANGALORE'];
            // reply(locations);

            event.getLocationList(function (error, output) {
                reply(output);
            });

        }
    });


    /**
     * the default handler for fetching static data(user uploaded images)
     */
    server.route({
        method: 'GET',
        path: '/getResource/{filename}',
        handler: function (request, reply) {
            try {
                let filePath = utility.filePath + request.params.filename;
                reply.file(filePath);
            }
            catch (error) {
                reply(error);
            }
        }
    });


    server.route({
        method: 'POST',
        path: '/user/createEventFeedback',
        handler: function (request, reply) {
            logThis('createEventFeedback', request);
            let payload = request.payload;
            let token = payload.token;
            let output = event.createEventFeedback(token, payload.data, function (error, output) {
                logOutputAndReturn(output); reply(output);
            });

        }
    });

    server.route({
        method: 'GET',
        path: '/user/getFeedback/{token}/{userId}/{eventId}',
        handler: function (request, reply) {
            logThis('getFeedback', request);
            let token = request.params.token;
            let userId = request.params.userId;
            let eventId = request.params.eventId;
            let output = event.getFeedback(token, userId, eventId, function (error, output) {
                logOutputAndReturn(output); reply(output);
            });
        }
    });


    server.route({
        method: 'POST',
        path: '/user/uploadFeedbackImages',
        config: {
            payload: {
                output: 'stream',
                parse: true,
                allow: 'multipart/form-data'
            },
            handler: function (request, reply) {
                logThis('uploadFeedbackImages', request);
                let data = request.payload;
                let imageFile = data.image;

                let output = event.uploadImages(data.token, imageFile, function (error, output) {
                    logOutputAndReturn(output); reply(output);
                });
            }
        }
    });



    function logThis(msg, request) { // commented in production 
        // console.log("\n-----------------------------------------------------\n");
        // console.log(" Received a new '" + msg + "' request from :" + request.info.remoteAddress + " at: " + new Date() + "\n");
        // console.log(request.payload);
        // console.log("-");
    }

    function logOutputAndReturn(response) { // commented in production 
        // console.log("\n\n");
        // console.log(" Sent the response at: " + new Date() + "\n");
        // console.log(response);
        // console.log("\n-----------------------------------------------------\n");
    }


    server.register(require('inert')
        , function (err) {
            if (err) throw err

            server.start(function (err) {
                console.log('Server started at: ' + server.info.uri)
            })
        });
};