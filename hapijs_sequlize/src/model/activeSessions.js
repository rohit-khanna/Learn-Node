/****************************************************************************************
 *    this module exposes the dictionary and related methods which are used to STORE 
 *              active user Sessions
 ****************************************************************************************/
//var rtg = require('random-token-generator');

/**
 * Dictionary of Active User Sessions
 * Saved as:  
     {
        id1: 'token1',
        id2: 'token2'
     }
 */
var UserSessions = { 1000: 1000 };

/**
 * method is used to get a random token:
 */
exports.getToken = function () {
    //return +new Date;
    // then to call it, plus stitch in '4' in the third group
    return guid = (S4() + S4() + S4() + "4" + S4().substr(0, 3) + S4() + S4() + S4() + S4()).toLowerCase();
}

/**
 * method is used to return token for input user ID.
 * - returns undefined if Not found
 */
module.exports.getUserSession = function (userID) {
    return UserSessions[userID];
}

/**
 * method is used to SET token for input user ID.
 */
module.exports.setUserSession = function (userID, token) {
    UserSessions[userID] = token;
}

/**
 * method is used to deleteUserSession
 */
module.exports.deleteUserSession = function (userID) {
    console.log('Current Sessions before delete:' + JSON.stringify(UserSessions));
    UserSessions[userID] = null;
    console.log('Current Sessions after delete:' + JSON.stringify(UserSessions));
    return true;
}

/**
 * return userID
 * @param {string} token :security token
 */
module.exports.checkForActiveSession = function (token) {

    let userID = null;
    console.log('Current Sessions Count:' + Object.keys(UserSessions).length);
    for (var key in UserSessions) {
        if (UserSessions.hasOwnProperty(key)) {
            if (token == UserSessions[key]) {
                return key;
            }
        }
    }
    return null;
}

function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
};
