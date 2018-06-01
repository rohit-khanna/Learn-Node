/**
 * This module contains the Schema for Models which will be used by ORM to interact with Database
 *  They should be in sync with DB Tables
 */
'use strict';
const Sequelize = require('sequelize');

module.exports.modelDbSchema = {

    sequelize: null, // to be set from invoker
    volunteerModelEntity: null, // set from setupDBModels function
    eventsModelEntity: null, // set from setupDBModels function
    eventLocationEntity: null, // set from setupDBModels function
    deviceRegistrationEntity: null,
    volunteerEventEntity: null,
    eventFeedbackEntity: null,

    /**
     * This is the Model Schema for 'volunteer' Model/Table
     */
    volunteerModelSchema: {
        forename: Sequelize.STRING,
        surname: Sequelize.STRING,
        password: Sequelize.STRING,
        gender: Sequelize.STRING,
        emailId: {
            type: Sequelize.STRING,
            unique: true
        },
        selfLocation: Sequelize.STRING,
        contactNo: Sequelize.STRING,
        imgUrlThmb: Sequelize.STRING,
        imgUrl: Sequelize.STRING,
        businessLocation: Sequelize.STRING,
        isAdmin: Sequelize.BOOLEAN,
        isInternal: Sequelize.BOOLEAN,
        isActivated: Sequelize.BOOLEAN,
        activationDate: Sequelize.DATE
    },

    /**
     * This is the MOdel Schema for 'event' Model/Table
     */
    eventsModelSchema: {
        eventName: Sequelize.STRING,
        eventDescription: Sequelize.TEXT,
        eventLocation: Sequelize.TEXT, //Addition requirment of center-wise data
        startDtTm: Sequelize.DATE,
        endDtTm: Sequelize.DATE,
        imgUrlThmb: Sequelize.STRING,
        imgUrl: Sequelize.STRING,
        contactNumber: Sequelize.STRING,
        contactPerson: Sequelize.STRING,
        eventAddress: Sequelize.TEXT,
        isActivated: Sequelize.BOOLEAN,
        activationDate: Sequelize.DATE
    },


    volunteerEventSchema: {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        startDtTm: {// start time filled by user
            type: Sequelize.DATE,
            required: true
        },
        endDtTm: { // end Time filled by user 
            type: Sequelize.DATE,
            required: true
        },
        requestStatus: {
            type: Sequelize.ENUM,
            values: ['APPROVED', 'REJECTED', 'PENDING'],
            required: true
        }
    },


    /**
     * Schema for Event Feedback. This will be associated with an EVENT + USER
     */
    eventFeedbackSchema: {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        rating: { // ratng liek 0.5 , 1 or 2.5
            type: Sequelize.DECIMAL(10, 1),
            required: true
        },
        description: { //feedback description
            type: Sequelize.STRING,
            required: true
        },
        imgUrl1: Sequelize.STRING,
        imgUrl2: Sequelize.STRING,
        isActivated: Sequelize.BOOLEAN,// if user wants to delete some feedback in future  (future extension)
        activationDate: Sequelize.DATE
    },


    /**
     *  Schema for Sopra Steria India Site locations
     */
    eventLocationSchema: {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },

        name: {
            type: Sequelize.STRING,
            required: true
        }
    },

    /**
     * Schema for registering device to send notifications
     */
    deviceRegistarionSchema: {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        volunteerId: {
            type: Sequelize.STRING,
            required: true
        },
        deviceUUID: {
            type: Sequelize.STRING,
            required: true
        },
        pushToken: {
            type: Sequelize.STRING,
            required: true
        },
        Platform: {
            type: Sequelize.STRING,
            required: true
        },
        isActivated: {
            type: Sequelize.BOOLEAN,
            required: true
        }
    },

    setupDBModels: function (cb) {
        this.volunteerModelEntity = this.sequelize.define('volunteer', this.volunteerModelSchema, {
            freezeTableName: true
        });

        this.eventsModelEntity = this.sequelize.define('event', this.eventsModelSchema, {
            freezeTableName: true
        });

        this.volunteerEventEntity = this.sequelize.define('VolunteerEvent', this.volunteerEventSchema, {
            freezeTableName: true
        });

        this.eventFeedbackEntity = this.sequelize.define('EventFeedback', this.eventFeedbackSchema, {
            freezeTableName: true
        });

        this.eventLocationEntity = this.sequelize.define('SiteLocation', this.eventLocationSchema, {
            freezeTableName: true
        });

        this.deviceRegistrationEntity = this.sequelize.define('DeviceRegistration', this.deviceRegistarionSchema, {
            freezeTableName: true
        });

        // creating association table for Volunteer-Event
        this.volunteerModelEntity.hasMany(this.volunteerEventEntity);
        this.eventsModelEntity.hasMany(this.volunteerEventEntity);
        this.volunteerEventEntity.belongsTo(this.volunteerModelEntity);
        this.volunteerEventEntity.belongsTo(this.eventsModelEntity);

        // creating association table for Event-Feedback
        this.volunteerModelEntity.hasMany(this.eventFeedbackEntity);
        this.eventsModelEntity.hasMany(this.eventFeedbackEntity);
        this.eventFeedbackEntity.belongsTo(this.volunteerModelEntity);
        this.eventFeedbackEntity.belongsTo(this.eventsModelEntity);

        // creating association tables for Event-EventLocation
        this.eventsModelEntity.belongsTo(this.eventLocationEntity);
        this.volunteerModelEntity.belongsTo(this.eventLocationEntity);




        // create table/schema
        this.sequelize.sync({ logging: false }).then(function () {
            console.log("DB Setup Done !");
            cb(null);

        }).catch(function (error) {
            console.log("ERROR in DB Setup." + error.message);
            cb(error);
        });
    },

};
