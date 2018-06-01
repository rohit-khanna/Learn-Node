/****************************************************************************************
 *    this module exposes the methods which are used frequently for utility purposes    *
 ****************************************************************************************/
const moment = require('moment');
const errHandler = require('./ErrorHandler');
const nodemailer = require('nodemailer');
const pathLib = require('path');

//console.log(moment.unix(1513752811).format("DDMMMYYHHmm"));
// console.log(moment().unix());
//console.log(moment().add(7, 'd').unix());
//console.log(moment('2018-01-12T10:00:00.000Z').unix());
//console.log(moment('2018-01-12T10:00:00.000Z').isSameOrBefore('2014-03-24T01:14:00Z'));
//console.log(moment('2018-01-11T18:00:00.000Z').isSameOrAfter(1515693600));
// console.log(moment('2018-01-11T18:00:00.000Z').isSameOrAfter('2018-01-11T19:00:00.000Z'));
// console.log(moment.unix(1513752811).format());
// console.log(moment.unix(1513752811).format('YYYY-MM-DD HH:mm:ss'));
/**
* returns current date as timestamp
*/
exports.getCurrDtTm = function () {
    //return +new Date  // javascript way
    return moment().unix()    // momentJs way
};


exports.filePath = pathLib.join(__dirname, "../files/");

/**
 * returns true, if input is either null or empty or whitespace or undefined
 */
exports.IsNullOrEmpty = function (value) {
    var result = false;
    if (!value)
        result = true;
    else {
        value = value.toString();
        if (value.trim() === '' || value == undefined) result = true;
    }
    return result;
};

/**
 * return date as : 2017-12-20T12:25:53+05:30
 */
exports.getISODate = function (timestamp) {
    //  return new Date(timestamp).toISOString();  // JS way
    let result = this.IsValidTimestamp(timestamp);
    if (result.success)
        return moment.unix(result.value).format()    // momentJS way
    else
        throw new Error("Invalid Timestamp:" + timestamp);
}

/**
 * return date as : 2017-12-20 12:00:15
 */
exports.getDateForDB = function (timestamp) {
    let result = this.IsValidTimestamp(timestamp);
    if (result.success)
        return moment.unix(result.value).format("YYYY-MM-DD HH:mm:ss")    // momentJS way
    else
        throw new Error("Invalid Timestamp:" + timestamp);
}

exports.getFormattedDate = function (timestamp, format) {
    let result = this.IsValidTimestamp(timestamp);
    if (result.success)
        return moment.unix(result.value).format(format)    // momentJS way
    else
        throw new Error("Invalid Timestamp:" + timestamp);
}


/**
 * returns a future/past date : counter
 */
exports.getSomeDate = function (counter) {
    return moment().add(counter, 'y').unix();
};

/**
 * Returns true if input email is a SopraSteria email ID.
 * @param {string} emailID 
 */
exports.checkInternalUserEmail = function (emailID) {
    if (emailID == undefined || this.IsNullOrEmpty(emailID)) {
        return false;
    }
    let emailLower = emailID.toString().toLowerCase();
    var reg = /^([a-z0-9_\-\.])+\@soprasteria+\.([a-z]{2,4})$/;
    if (!reg.test(emailLower)) {
        return false;
    }
    return true;
};

exports.IsValidTimestamp = function (timestamp) {
    let tmst = parseInt(timestamp);
    return { success: (new Date(tmst)).getTime() > 0, value: tmst };
};

/**
 * function used to check whether a date occurs beofre or after another date
 * @param { Datetime} isoDate1 
 * @param {boolean} greaterThanEqualTo :if false , check for lessThanEqualTo
 * @param { Datetime } isoDate2 
 */
exports.DateCompare = function (isoDate1, greaterThanEqualTo, isoDate2) {
    // console.log("isoDate1:" + this.getISODate(isoDate1));
    // console.log("isoDate2:" + this.getISODate(isoDate2));
    if (greaterThanEqualTo) {
        return moment(isoDate1).isSameOrAfter(isoDate2);
    }
    else {
        return moment(isoDate1).isSameOrBefore(isoDate2);
    }
}

exports.getTimestamp = function (isoDate) {
    return moment(isoDate).unix();
}


/**
 * used to send email
 * @param {string} recipientEmail 
 * @param {string} content 
 * @param {string} subject 
 * @param {function} cb of type function(error)
 */
exports.sendEmail = function (recipientEmail, content, subject, cb) {

    let emailCredentials = {
        user: "",
        pass: "",
        email: ''
    };
    const disclaimer = "<I>This is an auto-generated email. Please DONOT reply to this email." +
        "Replies to this message are routed to an unmonitored mailbox.If you have questions please contact CSR Team  </I>";
    const signature = "<br><br>Regards<br>CSR Team<br>";

    let transporter = nodemailer.createTransport({
        host: 'ptx.send.corp.sopra',
        port: 587,
        secure: false,
        auth: {
            user: emailCredentials.user,
            pass: emailCredentials.pass
        },
        tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false
        }
    });

    errHandler.logMessage("Transport Created for EMail Server", errHandler.LOG_LEVEL.INFO);

    transporter.verify(function (error, success) {
        if (error) {
            console.log(error);
            errHandler.logMessage(errHandler.EMAIlSERVER_NOT_READY, errHandler.LOG_LEVEL.ERROR);
            //throw new Error(errHandler.EMAIlSERVER_NOT_READY);
            //cb();
        } else {
            console.log('Server is ready to take our messages');
            transporter.sendMail({
                from: emailCredentials.email,
                to: 'priyanku.sharma@soprasteria.com',//recipientEmail,
                subject: subject,
                html: content + "<br><br>" + signature + "<br><br>" + disclaimer
            }).then(onFulfilled => {
                console.log(onFulfilled);
                errHandler.logMessage("Email Sent to " + recipientEmail, errHandler.LOG_LEVEL.INFO);
                cb();
            }).catch(error => {
                console.log(error);
                errHandler.logMessage(error, errHandler.LOG_LEVEL.ERROR);
                cb(error);
            });

        }
    });


} // End 


