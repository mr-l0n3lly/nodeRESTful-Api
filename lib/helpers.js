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
    try {
        return JSON.parse(jsonString);
    } catch (err) {
        return {}
    }
}

module.exports = helpers;