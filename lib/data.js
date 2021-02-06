/*
 * Library for storing and editing data
 */

// Dependecies
const fs = require('fs')
const path = require('path');
const { parseJsonToObject } = require('./helpers');
const helpers = require('./helpers');

// Container for the model (to be exported)
let lib = {};

// Base dir of the data folder
lib.baseDir = path.join(__dirname, '../.data/')

// Write data to a file
lib.create = (dir, file, data, callback) => {
    // Write to a file the data
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            // Convert data to string
            let stringData = JSON.stringify(data)

            // Write to file and close it
            fs.writeFile(fileDescriptor, stringData, (err) => {
                if (!err) {
                    fs.close(fileDescriptor, (err) => {
                        if (!err) {
                            callback(false)
                        } else {
                            callback('Error closing new file')
                        }
                    })
                } else {
                    callback('Error writing to new file')
                }
            })


        } else {
            callback('Could not create new file')
        }
    })
}

// Read data from a file
lib.read = (dir, filename, callback) => {
    fs.readFile(lib.baseDir + dir + '/' + filename + '.json', 'utf8', (err, data) => {
        if (!err && data) {
            let parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        } else {
            callback(err, data)
        }
    })
}

// Upload data inside a file
lib.update = (dir, filename, data, callback) => {
    // Open the file for writing
    fs.open(lib.baseDir + dir + '/' + filename + '.json', 'r+', (err, fileDiscriptor) => {
        if (!err && fileDiscriptor) {
            let stringData = JSON.stringify(data)

            // Truncate the file
            fs.truncate(fileDiscriptor, (err) => {
                if (!err) {
                    // Write to the file and close it
                    fs.writeFile(fileDiscriptor, stringData, (err) => {
                        if (!err) {
                            fs.close(fileDiscriptor, (err) => {
                                if (!err) {
                                    callback(false)
                                } else {
                                    callback('Could not close the file')
                                }
                            })
                        } else {
                            callback('Error writing to existing file')
                        }
                    })
                } else {
                    callback('Error truncate file')
                }
            })
        } else {
            callback('Could not open the file for updating, it may not exist yet')
        }
    })
}

lib.delete = (dir, file, callback) => {
    // Unlink the file
    fs.unlink(lib.baseDir + dir + '/' + file + '.json', (err) => {
        if (!err) {
            callback(false)
        } else {
            callback('Error deleting file')
        }
    })
}

module.exports = lib;