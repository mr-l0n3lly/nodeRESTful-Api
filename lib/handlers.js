// Dependencies
const { time } = require('console');
const { config } = require('./config');
const _data = require('./data');
const helpers = require('./helpers');

// Define the handlers
let handlers = {};

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
        // Get the token from the headers
        let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        // Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
            if (tokenIsValid) {
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
                callback(403, {'Error': 'Missing required token in header, or token is invalid'})
            }
        });
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

            // Get the token from the headers
            let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

            // Verify that the given token is valid for the phone number
            handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
                if (tokenIsValid) {
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
                                    callback(500, { 'Error': 'Could not update the user' });
                                }
                            });
                        } else {
                            callback(400, { 'Error': 'The specified user does not exists' })
                        }
                    });
                } else {
                    callback(403, {'Error': 'Missing required token in header, or token is invalid'})
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
        // Get the token from the headers
        let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        // Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
            if (tokenIsValid) {
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
                callback(403, {'Error': 'Missing required token in header, or token is invalid'})
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

// Verify if a given token is currently valid for a given user
handlers._tokens.verifyToken = function(id, phone, callback) {
    // Lookup the token
    _data.read('tokens', id, (err, tokenData) => {
        if (!err && tokenData) {
            // Check that the token is for the given user and has not expired
            if (tokenData.phoen == phone && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
}

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
                if(userData.hashedPassword == helpers.hash(password)) {
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
// Required data: id
handlers._tokens.get = function(data, callback) {
    // Check that the id is valid
    let id = typeof(data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;

    if (id) {
        // Lockup the user
        _data.read('tokens', id, function(error, data) {
            if (!error && data) {
                callback(200, data);
            } else {
                callback(404, { 'Error': 'User does not exist' })
            }
        })
    } else {
        callback(400, { 'Error': 'Missing required field' });
    }
}

// Tokens - put
// Require id, extend
// Optonal data: none
handlers._tokens.put = function(data, callback) {
    let id = typeof(data.payload.id) === 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    let extend = typeof(data.payload.extend) === 'boolean' && data.payload.extend === true ? data.payload.extend : false;

    if (id && extend) {
        // Look up for the tokens
        _data.read('tokens', id, (err, tokenData) => {
            if(!err && tokenData) {
                // Check to make sure token isnt already expired
                if(tokenData.expires > Date.now()) {
                    // Set a new expires + 1 h
                    tokenData.expires = Date.now() + 1000 * 60 * 60;

                    // Store new updates
                    _data.update('tokens', id, tokenData,  (err) => {
                        if(!err) {
                            callback(200, {'Success': 'Token updated'});
                        } else {
                            callback(500, {'Error': 'Could not update the token'});
                        }
                    });
                } else {
                    callback(400, {'Error': 'You cannot extend expired tokens'})
                }
            } else {
                callback(400, {'Error': 'Specified token doesnt exist'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field'});
    }


}

// Tokens - delete
// Required data: id
// Optional data: none
handlers._tokens.delete = function(data, callback) {
    // Check the phone number is valid
    let id = typeof(data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;

    if (id) {
        _data.read('tokens', id, function(error, data) {
            if (!error && data) {
                _data.delete('tokens', data.id, function(err) {
                    if (!err) {
                        callback(200, { 'Success': 'Token is deleted' });
                    } else {
                        callback(500, { 'Error': 'Could not delete specifyed token' })
                    }
                });
            } else {
                callback(404, { 'Error': 'Could not find the token' });
            }
        });
    } else {
        callback(400, { 'Error': 'Missing id' });
    }
}


// Checkers handeler
handlers.checks = function(data, callback) {
    let acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, callback);
    } else {
        callback(405);
    }
}

// Creating checks
handlers._checks = {};

// Checks post
// Required data: protocol, url, method, successCodes, timeoutSeconds
handlers._checks.post = function(data, callback) {
    // validate inputs
    let protocol = typeof(data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    let url = typeof(data.payload.url) == 'string' && data.payload.url.length > 0 ? data.payload.url : false;
    let method = typeof(data.payload.method) == 'string' && ['post', 'get', 'delete', 'put'].indexOf(data.payload.method) > -1 ? data.payload.method: false;
    let successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    let timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    if (protocol && url && method && successCodes && timeoutSeconds) {
        let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        // Lookup the user by reading the token
        _data.read('tokens', token, function(err, tokenData) {
            if(!err && tokenData) {
                let userPhone = tokenData.phone;

                // Lookup the user data
                _data.read('users', userPhone, function(err, userData) {
                    if(!err && userData) {
                        let userChecks = typeof(userData.checks) == 'object' ? userData.checks : [];
                        // verify if the user has less than the number of max checks

                        if (userChecks.length < 5) {
                            // Create a random id for the check
                            let checkId = helpers.createRandomString(20);
                            
                            // Create the check object and include the users phone
                            let checkObject = {
                                'id': checkId,
                                'userPhone': userPhone,
                                'protocol': protocol,
                                'url': url,
                                'method': method,
                                'successCodes': successCodes,
                                'timeoutSeconds': timeoutSeconds
                            }

                            // Save changes to disk
                            _data.create('checks', checkId, checkObject, function(err) {
                                if (!err) {
                                    // Add the users object
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);

                                    // Save current data to user
                                    _data.update('users', userPhone, userData, function(err) {
                                        if (!err) {
                                            // Return the data about the new check
                                            callback(200, checkObject);
                                        } else {
                                            callback(500, {'Error': 'Could not update the user with the new check'});
                                        }
                                    });
                                } else {
                                    calllback(500, {'Error': 'Could not create the new check'});
                                }
                            });
                        } else {
                            callback(400, {'Error': 'Maximum number of checks exceeded, maximum number is : ' + 5});
                        }
                    } else {
                        callback(404, {'Error': 'Could not find user with this token'});
                    }
                });
            } else {
                callback(403, {'Error': 'Unauthorized'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required inputs or invalid input'});
    }

}



// Ping handler
handlers.ping = function(data, callback) {
    callback(200, { 'msg': 'ping' });
};

// Not found handler
handlers.notFound = function(data, callback) {
    callback(404, { 'error': 'not existent route' });
};

module.exports = handlers;