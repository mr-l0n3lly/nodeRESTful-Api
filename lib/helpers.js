// Dependencies
const crypto = require('crypto');
const config = require('./config');

// Create helpers object
helpers = {};

// Create a SHA256 hash
helpers.hash = function(password) {
    if (typeof(password) === 'string' && password.length > 8) {
        return crypto.createHmac('sha256', config.hashingSecret).update(password).digest('hex');
    } else {
        return false;
    }
}

// Parse from json string to object
helpers.parseJsonToObject = function(jsonString) {
    //console.log(jsonString);
    try {
        return JSON.parse(jsonString);
    } catch (err) {
        return {}
    }
}

// Create a random function of alphanumeric characters, of a given length
helpers.createRandomString = function(length) {
<<<<<<< HEAD
    strLen = (typeof(length) === 'number' &&  length > 0) ? length : false;
=======
    strLen = typeof(length) == 'number' &&  length > 0 ? length : false;
>>>>>>> 3f14b5d13514c8738666a631c292494995236d87

    if(strLen) {
        let possibleCharacters = 'qazwsxedcrfvtgbyhnujmkolp1234567890';

        let str = '';
        for (let i = 0; i < strLen; i++) {
            str += possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
        }

        console.log(str);

        // Return the final string
        return str;

    } else {
        return false;
    }
}

module.exports = helpers;