var portScanner = require('portscanner');
var async = require('async');
var chokidar = require('chokidar');
var _ = require("lodash");
var clc = require("cli-color");
var fs = require("fs");
var connect = require("connect");
var http = require("http");

var UAParser = require('ua-parser-js');
var parser = new UAParser();

var options;

var scriptData = fs.readFileSync('lib/style-injector-client.js', "UTF-8");

var messages = {
    connection: function (browser) {
        return clc.cyan("Browser Connected! (" + browser.name + ", version: " + browser.version + ")");
    },
    init: function (hostIp, socketIoPort, scriptPort) {
        return clc.yellow('\n\nAll Set Up! Now copy & paste this snippet just before the closing </body> tag in your website.\n\n') +
                clc.magenta("<script src='http://" + hostIp + ":" + socketIoPort + "/socket.io/socket.io.js'></script>\n") +
                clc.magenta("<script src='http://" + hostIp + ":" + scriptPort + "/style-injector-client.js'></script>\n\n");
    },
    fileChanged: function (path) {
        return clc.magenta("File Changed: " + clc.green(path));
    },
    browser: {
        reload: function () {
            return clc.yellow("Reloading all connected browsers...");
        },
        inject: function () {
            return clc.yellow("Injecting file into all connected browsers...");
        }
    }
};

/**
 * Check if user doesn't want a verbose console.
 * @param {string} msg
 * @param {boolean} override
 */
var log = function (msg, override) {
    if (options.debugInfo || override) {
        console.log(msg);
    }
};

/**
 * Watch the files
 * @param files
 * @param io
 */
var watchFiles = function (files, io) {
    var watcher = chokidar.watch(files, {ignored: /^\./, persistent: true});

    var setupChangeFile = function (filepath) {
        changeFile(filepath, io);
    };

    watcher.on('change', setupChangeFile);
};

/**
 * Emit the event to the client to reload/inject
 * @param {string} path
 * @param ioInstance
 */
var changeFile = function (path, ioInstance) {

    log(messages.fileChanged(path), false);

    // get the file extention
    var fileExtension = /\.[a-zA-Z]{2,4}$/.exec(path)[0];
    var data = {};

    // reload the entire page if the changed file's extension is in the options array
    if (_.contains(options.reloadFileTypes, fileExtension)) {
        data.url = path;
        ioInstance.sockets.emit("reload", data);
        log(messages.browser.reload(), false);
    }

    if (_.contains(options.injectFileTypes, fileExtension)) {
        // try to inject the files.
        data.assetUrl = transformUrl(path, options.urlTransforms);
        data.fileExtention = fileExtension;
        ioInstance.sockets.emit("reload", data);
        log(messages.browser.inject(), false);
    }

    return data;
};

/**
 * Serve the client-side javascript.
 * @param {string} hostIp
 * @param {number} socketIoPort
 * @param {number} scriptPort
 */
var serveCustomScript = function (hostIp, socketIoPort, scriptPort) {

    // Intercept request for custom script, inject the info about socketIO
    var app = connect().use("/style-injector-client.js", function (req, res, next) {

        res.setHeader("Content-Type", "text/javascript");
        res.end(scriptData.replace("REMOVE", hostIp + ":" + socketIoPort));

    });

    http.createServer(app).listen(scriptPort);
};


/**
 * Method exposed to Grunt Task
 * @param {array} files - relative file paths
 * @param {object} gruntOptions - merged default options & user options
 * @param {function} done - Kill the grunt task on errors
 */
module.exports.watch = function (files, gruntOptions, done) {

    var io;
    options = gruntOptions;

    async.waterfall([
        /**
         * Find an empty port for SOCKET.IO
         * @param callback
         */
                function (callback) {
            portScanner.findAPortNotInUse(3000, 3020, 'localhost', function (error, port) {
                callback(null, port);
            });
        },
        function (socketIoPort, callback) {

            var ua;

            io = require('socket.io').listen(socketIoPort);
            io.set('log level', 0);

            // print to console when browsers connect
            io.sockets.on("connection", function (client) {
                ua = client.handshake.headers['user-agent'];
                log(messages.connection(parser.setUA(ua).getBrowser()), false);
            });

            // Find a free port for our custom client script
            portScanner.findAPortNotInUse(3000, 3020, 'localhost', function (error, scriptPort) {
                callback(null, io, getHostIp(), socketIoPort, scriptPort);
            });

        },
        function (io, hostIp, socketIoPort, scriptPort, callback) {

            // Serve Custom Client-side JS
            serveCustomScript(hostIp, socketIoPort, scriptPort);

            // Show Snippet info for copy & paste
            log(messages.init(hostIp, socketIoPort, scriptPort), true);

            // Watch the files
            watchFiles(files, io);

            callback(null, 'two');
        }
    ],
    function (err, results) {
        if (err) {
            done();
        }
    });
};

/**
 * Ensure the client receives the correct url for the asset (not the relative path used for watching)
 * @param {string} path
 * @returns {string}
 * @param {object} urlTransforms (prefix, suffix, remove)
 */
var transformUrl = function (path, urlTransforms) {

    if (urlTransforms.remove) {
        path = path.replace(urlTransforms.remove, "");
    }

    return [urlTransforms.prefix, path, urlTransforms.suffix].join("");
};

/**
 * Get the external HostIp
 * @returns {*}
 */
var getHostIp = function () {

    var os = require('os');
    var networkInterfaces = os.networkInterfaces();
    var externalIp = null;

    _.each(networkInterfaces, function (_interface) {
        return _.each(_interface, function (address) {
            if (address.internal === false && address.family === "IPv4") {
                externalIp = address.address;
            }
        });
    });

    return externalIp;
};


// export methods for tests
module.exports.transformUrl = transformUrl;
module.exports.getHostIp = getHostIp;
module.exports.changeFile = changeFile;