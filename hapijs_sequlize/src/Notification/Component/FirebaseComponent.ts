/**********************************************************************************
 ****          ALWAYS MODIFY  .ts FILE AND "NOT" THE .js FILE   **********
 ***********************************************************************************/
import { INotificationComponent, IDeviceIdentifier, INotificationMessagePayload, IDataMessagePayload, INotificationMessage, IPlatformSpecificConfiguration, DEVICE_PLATFORM } from "./IComponent";

const utility = require("../../utility");
var request = require('request');
const notification_server_key='AAAAK7y2Q8c:APA91bEH_FCq7stG0hrCxzxs_YbhgIpO2oEhaO-TnhWidad9WXCq99xT5YkOzWKhZ0D9aGQFR51lPXCX0obl8fTwmA8arUkyTP6UPMlcXp6eikR3z5NuCUkDHStepWmAiORLoG88Jx-O ';
const notification_provider_url="https://gcm-http.googleapis.com/gcm/send";

/**
 * Class depicting Device Identifier for Firebase
 */
export class FirebaseDeviceIdentifier implements IDeviceIdentifier {
    public registrationToken: string;
    constructor(deviceToken: string) {
        this.registrationToken = deviceToken;
    }
}

/**
 * Class defining Firebase component
 */
export class FirebaseComponent implements INotificationComponent {

    provider: string = "FIREBASE";
    notificationMessage: FirebaseNotification;
    sysConfig: any;

    /**
     * Contructor
     * @param notificationMessage Firebase notification instance
     */
    constructor(notificationMessage: FirebaseNotification) {
        this.notificationMessage = notificationMessage;
    }

    /**
     * method to send out the notification using object properties.
     * returns the Messageid  as returned from NotificationProvider
     * @param {(error,data)} callback callback function of signature (success)
     */
    sendNotificationToDevice(callback): void {
        const headers = {
            'Authorization': 'key=' + notification_server_key,
            'Content-Type': 'application/json'
        }

        let body = this.notificationMessage.getPerDeviceNotificationAsJson();

        console.log(body);

        request.post(
            {
                headers: headers,
                url: notification_provider_url,
                body: body,
                json: true
            },
            function (error, response, body) {
                //console.log("sending");
                console.log(body);
                callback(error, { data: { msgID: body.multicast_id } });
            }
        );
    }; // end sendNotification


}

/**
 * Class defining Notification Message Payload as per:
 * https://firebase.google.com/docs/reference/admin/node/admin.messaging.NotificationMessagePayload 
 * https://firebase.google.com/docs/cloud-messaging/http-server-ref#notification-payload-support 
 */
export class FCMNotificationMessagePayload implements INotificationMessagePayload {
    public properties = {
        /**
         * iOS 
         */
        badge: null,// string,
        /**
         * iOS+Android : Body Text
         */
        body: null,// string,
        /**
         * iOS+Android
         */
        bodyLocArgs: null,// string,
        /**
         * iOS+Android
         */
        bodyLocKey: null,// string,
        /**
         * iOS+Android
         */
        clickAction: null,// string,
        /**
         * Android
         */
        color: null,// string,
        /**
         * Android
         */
        icon: null,// string,
        /**
         * iOS+Android
         */
        sound: null,// string,
        /**
         * Android
         */
        tag: null,// string,
        /**
         * not visible on iOS Device
         */
        title: null,// string,
        /**
         * iOS+Android
         */
        titleLocArgs: null,// string,
        /**
         * iOS+Android
         */
        titleLocKey: null,// string,
        /**
         * iOS
         */
        subtitle: null,// string,
        /**
         * Android
         */
        android_channel_id: null,// string,
    }

    /**
     * method to return an object of included properties
     * @param skipEmptyOrNulls boolean to skip or include null or empty values
     */
    getJSONObject(skipEmptyOrNulls: boolean) {
        if (skipEmptyOrNulls == false) {
            return this.properties;
        }
        else {
            let jsonObject = Object.assign({}, this.properties);
            for (var key in jsonObject) {
                if (jsonObject.hasOwnProperty(key)) {
                    let value = jsonObject[key];
                    if (value === "" || value === null) {
                        delete jsonObject[key];
                    }
                }
            }
            return jsonObject;
        }
    }

}

/**
 * Class defining the Data Message Payload: Key Value Pair for user data
 */
export class FCMDataMessagePayload implements IDataMessagePayload {
    /**
     * The keys and values must both be strings
     */
    message: string;
    logID: number;

}

/**
 * Class Defining the Firebase Notification Message
 */
export class FirebaseNotification implements INotificationMessage {

    /*************************************************
                  INTERFACE PUBLIC PROPERTIES 
      ************************************************/
    public receipients: FirebaseDeviceIdentifier[];
    public data: FCMDataMessagePayload;
    public notification: FCMNotificationMessagePayload;
    public targetPlatform: DEVICE_PLATFORM;

    /*************************************************
                  PRIVATE PROPERTIES 
      ************************************************/
    private _android: any;  //AndroidConfig;
    private _apns: any;     //iOSConfig;


    /**
     * Private method
     */
    private getPerDeviceNotificationAsJSON_Android(): any {
        return {
            "to": this.receipients[0].registrationToken,
            "priority": (this._android) ? this._android.priority : "HIGH",
            "time_to_live": 604800 * 4, // 4 weeks
            "data": JSON.parse(JSON.stringify(this.data)),
            "notification": this.notification.getJSONObject(true)
        };
    }

    /**
    * Private method
    */
    private getPerDeviceNotificationAsJSON_IOS(): any {
        return {
            'to': this.receipients[0].registrationToken,
            'priority': (this._apns) ? this._apns.headers["apns-priority"] : 10,
            'content_available': false, // will use FCM and NOT APNS
            'data': JSON.parse(JSON.stringify(this.data)),
            'notification': this.notification.getJSONObject(true)
        };
    }

    /***************************************************
     *****    Constructor  for FirebaseNotification   **  
     ****************************************************                     
     * @param dataPayload data payload
     * @param notificationMessagePayload  notification payload
     * @param receipients Array of Receipients
     */
    constructor(dataPayload: FCMDataMessagePayload, notificationMessagePayload: FCMNotificationMessagePayload,
        receipientsArray: FirebaseDeviceIdentifier[]) {
        this.data = dataPayload;
        this.notification = notificationMessagePayload;
        if (receipientsArray != null && receipientsArray.length > 0)
            this.receipients = receipientsArray;
        else
            this.receipients = [new FirebaseDeviceIdentifier(null)];
    }


    /********************************************
     *****  SETTER  for AndroidConfiguration   **  
     ********************************************/
    public set AndroidConfiguration(config: IPlatformSpecificConfiguration) {
        this._android = {};
        if (config instanceof AndroidConfig) {
            if (config as AndroidConfig) {
                if (!utility.IsNullOrEmpty(config.priority)) {
                    this._android.priority = config.priority;
                }
                if (!utility.IsNullOrEmpty(config.ttl)) {
                    this._android.ttl = config.ttl;
                }
                if (!utility.IsNullOrEmpty(config.collapse_key)) {
                    this._android.collapse_key = config.collapse_key;
                }
                if (!utility.IsNullOrEmpty(config.restricted_package_name)) {
                    this._android.restricted_package_name = config.restricted_package_name;
                }
                if (config.data) {
                    this._android.data = config.data;
                }
                if (config.notification) {
                    this._android.notification = config.notification;
                }
            }
        }
    }


    /********************************************
   *****  GETTER  for AndroidConfiguration   **  
   ********************************************/
    public get AndroidConfiguration(): IPlatformSpecificConfiguration {
        return this._android;
    }

    /********************************************
    *****  GETTER  for IOSConfiguration   **  
    ********************************************/
    public get IOSConfiguration(): IPlatformSpecificConfiguration {
        return this._apns;
    }

    /********************************************
     *****  SETTER  for IOSConfiguration   **  
     ********************************************/
    public set IOSConfiguration(config: IPlatformSpecificConfiguration) {
        this._apns = {};
        if (config instanceof iOSConfig) {
            if (config as iOSConfig) {
                if (config.headers) {
                    this._apns.headers = config.headers;
                }
                if (config.payload) {
                    this._apns.payload = config.payload;
                }
            }
        }
    }


    /**
     * Method to return the ONE DEVICE Notification Message entity as JSON
     */
    public getPerDeviceNotificationAsJson() {
        return this.targetPlatform == DEVICE_PLATFORM.IOS ?
            this.getPerDeviceNotificationAsJSON_IOS() :
            this.getPerDeviceNotificationAsJSON_Android();
    }

    public getBroadcastNotificationAsJSON(): any {
        return {
            'registration_ids': this.receipients
        };
    }

};

export class AndroidConfig implements IPlatformSpecificConfiguration {
    collapse_key: string;
    priority: string = "HIGH"; // NORMAL or HIGH
    ttl: string = "604800s"; // 7 days
    restricted_package_name: string;
    data: any = {}; // if present overrides Main 'data'
    notification: any = {}; // if present overrides Main 'notification'
};

export class iOSConfig implements IPlatformSpecificConfiguration {
    private apns_priority: number = 10;
    private apns_expirataion: any = utility.getTokenExpireDtTm();

    /**
     * APNS specific headers
     */
    headers: any = {
        "apns-priority": this.apns_priority,
        "apns-expiration": this.apns_expirataion
    };
    /**
     * Apns specific Payload
     */
    payload: any = {}; //APS Dictionary Keys
}