// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

// Define the handlers
let handlers = {};

// Not found handler
handlers.notFound = function(data, callback) {
    callback(404, { 'error': 'not existent route' });
};

// Ping handler
handlers.ping = function(data, callback) {
    callback(200, { 'msg': 'ping' });
};

// User handeler
handlers.users = function(data, callback) {
    let acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
}

// Container for the users submethods
handlers._users = {};

// Users post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function(data, callback) {
    // Check that all required fields are filled out
    let firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    let lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    let phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    let password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 8 ? data.payload.password.trim() : false;
    let tosAgreement = typeof(data.payload.tosAgreement) === 'boolean' ? data.payload.tosAgreement : false;

    if (firstName && lastName && phone && password && tosAgreement) {
        // Make sure that the user doesnt already exists
        _data.read('users', phone, function(error, data) {
            if (error) {
                // Hash password
                let hashedPassword = helpers.hash(password);

                if (hashedPassword) {
                    // Create users object
                    let userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'hashedPassword': hashedPassword,
                        'tosAgreement': tosAgreement
                    };

                    // Store the user
                    _data.create('users', phone, userObject, function(err) {
                        if (!err) {
                            callback(200, { 'Message': 'User successful created' })
                        } else {
                            console.log(err);
                            callback(500, { 'Error': 'Could not create the user' })
                        }
                    })
                } else {
                    callback(500, { 'Error': 'Could not crypt users password :/' });
                }
            } else {
                // User with this phone number already exists
                callback(400, { 'Error': 'User already exists with this phone number' });
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required fields' });
    }

};

// Users get
// Required data: phone
// Optional data: none
handlers._users.get = function(data, callback) {
    // Check the phone number is valid
    let phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;

    if (phone) {
        // Lockup the user
        _data.read('users', phone, function(error, data) {
            if (!error && data) {
                // Remove the hash password from the user object before sending
                delete data.hashedPassword;
                callback(200, data);
            } else {
                callback(404, { 'Error': 'User does not exist' })
            }
        })
    } else {
        callback(400, { 'Error': 'Missing required field' });
    }

};

// Users put
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.put = function(data, callback) {
    // Check the phone number is valid
    let phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

    // Check for optional fields
    let firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    let lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    let password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 8 ? data.payload.password.trim() : false;

    if (phone) {
        if (firstName || lastName || password) {
            // Lookup for the users
            _data.read('users', phone, function(error, data) {
                if (!error && data) {
                    if (firstName) {
                        data.firstName = firstName;
                    }

                    if (lastName) {
                        data.lastName = lastName;
                    }

                    if (password) {
                        data.password = helpers.hash(password);
                    }

                    // Store new updates
                    _data.update('users', phone, data, function(error) {
                        if (!error) {
                            callback(200, { 'Success': 'Everything is good' })
                        } else {
                            console.log(error);
                            callback(500, { 'Error': 'Could not update the user' });
                        }
                    });
                } else {
                    callback(400, { 'Error': 'The specified user does not exists' })
                }
            });
        } else {
            callback(400, { 'Error': 'Missing fields to update' })
        }
    } else {
        callback(404, { 'Error': 'Missing number' });
    }
};

// Users delete
// Required data: phone
handlers._users.delete = function(data, callback) {
    // Check the phone number is valid
    let phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;

    if (phone) {
        _data.read('users', phone, function(error, data) {
            if (!error && data) {
                _data.delete('users', data.phone, function(err) {
                    if (!err) {
                        callback(200, { 'Success': 'User is deleted' });
                    } else {
                        callback(500, { 'Error': 'Could not delete specifyed user' })
                    }
                });
            } else {
                callback(404, { 'Error': 'Could not find the number' });
            }
        });
    } else {
        callback(400, { 'Error': 'Missing number' });
    }
};


// Tokens handeler
handlers.tokens = function(data, callback) {
    let acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
}

// Creating containers for each method
handlers._tokens = {};


module.exports = handlers;

// Tokens - post
// Required data: phone, password
handlers._tokens.post = function(data, callback) {
    // Check the phone number is valid
    let phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    let password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 8 ? data.payload.password.trim() : false;

    if(phone && password) {
        // Look up the user who matches this phone number
        _data.read('users', phone, function(error, userData) {
            if(!error && userData) {
                // Hash sent password and compare to the password stored
                if(userData.password == helpers.hash(password)) {
                    // Id valid, create a new token with a random name.
                    let tokenId = helpers.createRandomString(20);
                    let expires = Date.now() + 1000 * 60 * 60;
                    let tokenObject = {
                        'phone': phone,
                        'id': tokenId,
                        'expires': expires
                    };

                    // Store the token
                    _data.create('tokens', tokenId, tokenObject, function(error) {
                        if(!error) {
                            callback(200, tokenObject);
                        } else {
                            callback(500, {'Error': error});
                        }
                    });
                } else {
                    callback(401, {'Error': 'Wrong password specified'});
                }
            } else {
                callback(400, {'Error': 'Could not find the specified user'});                
            }
        });
    } else {
        callback(400, {'Error': 'Missing required fields'})
    }

}

// Tokens - get
handlers._tokens.get = function(data, callback) {
    
}

// Tokens - put
handlers._tokens.put = function(data, callback) {
    
}

// Tokens - delete
handlers._tokens.delete = function(data, callback) {
    
}
