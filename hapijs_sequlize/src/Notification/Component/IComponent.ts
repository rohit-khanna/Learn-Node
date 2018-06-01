/**********************************************************************************
 ****          ALWAYS MODIFY  .ts FILE AND "NOT" THE .js FILE   **********
 ***********************************************************************************/

export enum DEVICE_PLATFORM {
    ANDROID = "ANDROID",
    IOS = "IOS",
    WINDOWS = "WINDOWS"
}



/**
 * Notification Component Interface
 */
export interface INotificationComponent {
    /**
     * Provider name : any string
     */
    provider: string;
    /**
     * The notifiation Message Instance
     */
    notificationMessage: INotificationMessage;

   /**
    * Method to send the NotificationMessage 
    */
    sendNotificationToDevice(callback): void;
}

/**
 * interface to define the Notification Message 
 */
export interface INotificationMessage {

    /**
     * Receipients Identifier Array
     */
    receipients: IDeviceIdentifier[];

    /**
     * Stores Key Value Pairs
     */
    data: IDataMessagePayload;

    /**
     * Stores Platform specific 'exact' name properties
     */
    notification: INotificationMessagePayload;

    /**
     * targetPlatform
     */
    targetPlatform:DEVICE_PLATFORM;
}

/**
 * interface to define the Data Message Payload
 */
export interface IDataMessagePayload {

}

/**
 * interface to define the Device identifier
 */
export interface IDeviceIdentifier {

}

/**
 * interface to define the Notification Message Payload
 */
export interface INotificationMessagePayload {
    getJSONObject(skipEmptyOrNulls: boolean): any;
}

/**
 * interface to define the Platform Config
 */
export interface IPlatformSpecificConfiguration {

}
