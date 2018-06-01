'use strict'
var qr = require('qr-image'); // https://github.com/alexeyten/qr-image

function _createImageForInput(inputString) {
    let img = qr.image(inputString, {
        margin: 2,
        size: 10
    });
    return img;
}

function _createImageStringForInput(inputString) {
    let imgStr = qr.imageSync(inputString, {
        margin: 2,
        size: 10
    });
    return imgStr;
}




var manager = {
    supportedTypes: {
        JSON: 'JSON',
        BUFFER: 'BUFFER',
        UTF8: 'UTF8'
    },
    getImage: function (inputString) {
        return _createImageForInput(inputString);
    },
    getImageString: function (inputString, type) {
        switch (type) {
            case this.supportedTypes.BUFFER:
                return _createImageStringForInput(inputString)
                break;
            case this.supportedTypes.JSON:
                return JSON.stringify(_createImageStringForInput(inputString));
                break;
            case this.supportedTypes.UTF8:
                return _createImageStringForInput(inputString).toString('utf8')
                break;
            default:
                return JSON.stringify(_createImageStringForInput(inputString));
                break;
        }

    }
};

exports.manager = manager;