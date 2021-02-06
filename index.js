/*
 *
 *	Primary file for the API
 *
 *
 */

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const stringDecoder = require('string_decoder').StringDecoder;
const env = require('./lib/config');
const fs = require('fs');
const _data = require('./lib/data');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

// Create HTTP server instance
http.createServer(function(req, res) {
    unifiedServer(req, res);
}).listen(env.httpPort, () => {
    console.log('The server is listening on port ' + env.httpPort + ' now');
});

// Set up HTTPS server options
let httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
};

// Create HTTP server instance
https.createServer(httpsServerOptions, function(req, res) {
    unifiedServer(req, res);
}).listen(env.httpsPort, () => {
    console.log('The server is listening on port ' + env.httpsPort + ' now');
});

// All the server logic for both the http and https server
let unifiedServer = function(req, res) {
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

    req.on('data', function(data) {
        buffer += decoder.write(data);
    });

    req.on('end', function() {
        buffer += decoder.end();

        // Choose a handler this request should go to.
        let choosen = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        // Construct the data object to send to the handler
        let data = {
            'trimmmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        }

        // Route the request to the handler

        choosen(data, function(statusCode, payload) {
            // Use the statusCode called back by the handler, or default to 200
            statusCode = typeof(statusCode) === 'number' ? statusCode : 200;

            // Use the payload called back by the handler, or default empty object
            payload = typeof(payload) === 'object' ? payload : {};

            // Convert the payload to a string
            let payloadString = JSON.stringify(payload);

            // Return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
        });
    });
}

// Define a request router
let router = {
    'ping': handlers.ping,
    'users': handlers.users
};