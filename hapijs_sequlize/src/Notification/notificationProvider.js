
const component = require('./Component/FirebaseComponent');
const NOTIFICATION_TITLE = "CSR: New notification";
const NOTIFICATION_BODY = "You got a notification";
const componentInterface = require('./Component/IComponent');
const API = require('../DataAPI');


/**
 * method used to send notifications
 * @param {number} userPrimaryKey user primary key
 * @param {string} notificationMessage notification message
 * @param {(error,data)} callback 
 */
exports.sendNotification = function (userPrimaryKey, notificationMessage, callback) {

    let pushTokenForDevice = null; let platform = null;


    getActiveDeviceInfoForUser(userPrimaryKey, function (dataArray) {
        if (dataArray) {
            var fbComponent = prepareNotificationMessage(dataArray, { message: notificationMessage }, "ANDROID");
            fbComponent.sendNotificationToDevice(function (error, data) {
                console.log(data);
                callback(error, data);
            });
        }
        else {
            throw new Error("Device not found");
        }

    });
};

/**
 * method to get Active Device Info For User
 * @param {number} userPrimaryKey if not send will return all devices for all users
 * @param {(data)} callback json object
 */
function getActiveDeviceInfoForUser(userPrimaryKey, callback) {

    let arrayOfResults = [];
    API.getActiveDevicesToNotify(userPrimaryKey, function (error, data) {
        if (data) {
            arrayOfResults = data;
        }
        callback(arrayOfResults);
    });

};

/**
 * This method is used to prepare Notification Message to be snet ahead to the notification Provider
 * @param {*} deviceToken device token for the target user device Array
 * @param {*} dataPayload data payload object {message,workOrderID}
 * @param {enum} platform DEVICE_PLATFORM-> IOS, WINDOW, ANDROID
 */
function prepareNotificationMessage(deviceTokenArray, dataPayload, platform) {

    let deviceIDArray, dataMessagePayload, notificationMessagePayload, notificationMessage, androidCnfig, firebaseComponent;

    deviceTokenArray.forEach(element => {
        deviceIDArray.push(new component.FirebaseDeviceIdentifier(deviceToken));
    });


    dataMessagePayload = new component.FCMDataMessagePayload();
    dataMessagePayload.message = dataPayload.message;


    notificationMessagePayload = new component.FCMNotificationMessagePayload();
    notificationMessagePayload.properties.body = dataPayload.message;//NOTIFICATION_BODY;
    notificationMessagePayload.properties.title = NOTIFICATION_TITLE;

    notificationMessage = new component.FirebaseNotification(dataMessagePayload, notificationMessagePayload, deviceIDArray);

    // if (platform == componentInterface.DEVICE_PLATFORM.ANDROID) {
    //     androidCnfig = new component.AndroidConfig();
    //     notificationMessage.AndroidConfiguration = androidCnfig;
    //     notificationMessage.targetPlatform = componentInterface.DEVICE_PLATFORM.ANDROID;
    // }
    // else if (platform == componentInterface.DEVICE_PLATFORM.IOS) {
    //     notificationMessage.IOSConfiguration = new component.iOSConfig();
    //     notificationMessage.targetPlatform = componentInterface.DEVICE_PLATFORM.IOS;
    // }
    firebaseComponent = new component.FirebaseComponent(notificationMessage);
    return firebaseComponent;
}

