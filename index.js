/*
 *
 *	Primary file for the API
 *
 *
 */

// Dependencies
const http = require('http');
const url = require('url');
const stringDecoder = require('string_decoder').StringDecoder;

// The server should respond to all request with a string
const server = http.createServer(function(req, res) {
    //Get the URL and parse it
    let parsedUrl = url.parse(req.url, true);

    // Get the path
    let path = parsedUrl.pathname;
    let trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object
    let queryStringObject = parsedUrl.query;

    // Get the HTTP method
    let method = req.method.toLowerCase();

    // Get the headers as an object
    let headers = req.headers;

    // Get the payload, if any
    const decoder = new stringDecoder('utf-8');
    let buffer = '';

    req.on('data', function (data) {
        buffer += decoder.write(data);
    });

    req.on('end', function () {
        buffer += decoder.end();

        // Choose a handler this request should go to.
        let choosen = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
        
        // Construct the data object to send to the handler
        let data = {
            'trimmmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': buffer
        }

        // Route the request to the handler

        choosen(data, function (statusCode, payload) {
            // Use the statusCode called back by the handler, or default to 200
            statusCode = typeof(statusCode) === 'number' ? statusCode: 200;

            // Use the payload called back by the handler, or default empty object
            payload = typeof(payload) === 'object' ? payload: {};

            // Convert the payload to a string
            let payloadString = JSON.stringify(payload);

            // Return the response
            res.writeHead(statusCode);
            res.end(payloadString);
        });
    });
});

// Start the server, and have ti listen on port 3000
server.listen(3000, function() {
    console.log('The server is listening on port 3000 now')
});

// Define the handlers
let handlers = {};

handlers.sample = function (data, callback) {
    // Callback a http status code, and a payload object
    callback(406, {'name': 'sample handler'});
};

// Not found handler
handlers.notFound = function (data, callback) {
    callback(404, {'error': 'not existent route'});
};

// Define a request router
let router = {
    'sample': handlers.sample
};