'use strict';

const Joi = require('joi');

module.exports.userEntityValidationSchema = Joi.object({
    forename: Joi.string(),
    surname: Joi.string(),
    password: Joi.string(),
    gender: Joi.string(),
    emailId: Joi.string(),
    imgUrlThmb: Joi.optional(),
    imgUrl: Joi.optional(),
    selfLocation: Joi.string(),
    contactNo: Joi.string(),
    businessLocation: Joi.string(),
    isAdmin: Joi.bool()
}).required(); // required means: If key is missing its OK, but if PRESENt, should adhere to this schema

module.exports.eventEntityValidationSchema = Joi.object({
    eventName: Joi.string(),
    eventDescription: Joi.string(),
    eventLocation: Joi.string(), //Addition requirment of center-wise data
    startDtTm: Joi.date(),
    endDtTm: Joi.date(),
    imgUrlThmb: Joi.optional(),
    imgUrl: Joi.optional(),
    contactNumber: Joi.string(),
    contactPerson: Joi.string(),
    eventAddress: Joi.string()
}).required();

module.exports.eventFeedbackValidationSchema = Joi.object({
    rating: Joi.number(),
    eventId: Joi.number(),
    token: Joi.string(),
    imgUrl1: Joi.optional(),
    imgUrl2: Joi.optional(),
    description: Joi.string()
}).required();
