var portScanner = require('portscanner');
var async = require('async');
var chokidar = require('chokidar');
var _ = require("lodash");
var fs = require("fs");
var filePath = require("path");
var connect = require("connect");
var http = require("http");
var UAParser = require('ua-parser-js');
var messages = require('./messages');
var loadSnippet = require('./loadSnippet');

var parser = new UAParser();
var options;

var scriptData = fs.readFileSync(__dirname + messages.clientScript, "UTF-8");

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
        data.assetUrl = filePath.basename(path);
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
 * @param {object} options (grunt options)
 */
var serveCustomScript = function (hostIp, socketIoPort, scriptPort, options, grunt) {

    var app, baseUrl;

    loadSnippet.setVars(hostIp, socketIoPort, scriptPort);

    // Intercept request for custom script, inject the info about socketIO
    var modifySnippet = function (req, res) {
        res.setHeader("Content-Type", "text/javascript");
        res.end( "var socket = io.connect('" + hostIp + ":" + socketIoPort +"');" + scriptData);
    };

    if (!options.server) {
        app = connect().use(messages.clientScript, modifySnippet);
    } else {

        if (options.server.baseDir[0] === "/") {
            grunt.fail.fatal(messages.invalidBaseDir());
        }

        baseDir = options.server.baseDir || "./"; // Serve root directory if no baseDir is specified

        app = connect()
                .use(messages.clientScript, modifySnippet)
                .use(loadSnippet.middleWare)
                .use(connect.static(filePath.resolve(baseDir)));

        var open = require("open");
        open("http://"+hostIp+":"+scriptPort);
    }

    http.createServer(app).listen(scriptPort);

    // Show Message with either Snippet info, or with server info
    if (options.server) {
        log(messages.initServer(hostIp, scriptPort, getBaseDir(baseDir), options), true);
    } else {
        log(messages.init(hostIp, socketIoPort, scriptPort), true);
    }
};

function getBaseDir(baseDir) {

    if (baseDir === "./") {
        return process.cwd();
    }

    if (baseDir[0] === "/") {
        return process.cwd() + baseDir;
    } else {
        if (baseDir[0] === "." && baseDir[1] === "/"){
            return process.cwd() + baseDir.replace(".", "");
        }
        return process.cwd() + "/" + baseDir;
    }
}

/**
 * @param data
 */
var updateLocations = function (data) {
    log(messages.location(data.url), false);
    this.broadcast.emit("location:update", { url: data.url });
};

/**
 * Update scroll position of browsers.
 * @param data
 */
var updateScrollPosition = function (data) {
    this.broadcast.emit("scroll:update", { position: data.pos, ghostId: data.ghostId, url: data.url});
};

/**
 * Update a text input;
 * @param data
 */
var updateFormField = function (data) {
    this.broadcast.emit("input:update", { id: data.id, value: data.value });
};

/**
 * Update a select element
 * @param data
 */
var updateSelectField = function (data) {
    this.broadcast.emit("input:update", { id: data.id, value: data.value });
};

/**
 * Update Radio Field
 * @param data
 */
var updateRadioField = function (data) {
    this.broadcast.emit("input:update:radio", { id: data.id, value: data.value });
};

/**
 * Update Checkbox
 * @param data
 */
var updateCheckboxField = function (data) {
    this.broadcast.emit("input:update:checkbox", { id: data.id, checked: data.checked });
};

/**
 * Submit a form
 * @param data
 */
var submitForm = function (data) {
    this.broadcast.emit("form:submit", { id: data.id });
};

/**
 * If ghostMode was enabled, inform all browsers when any of them changes URL.
 * @param io
 * @param client
 * @param options
 */
var setLocationTracking = function (io, client, options) {

    // remember the context of the client that emitted the event.
    if (options.ghostMode) {
        client.on("location", updateLocations);
        client.on("scroll", updateScrollPosition);
        client.on("input:type", updateFormField);
        client.on("input:select", updateSelectField);
        client.on("input:radio", updateRadioField);
        client.on("input:checkbox", updateCheckboxField);
        client.on("form:submit", submitForm);
    }
};

/**
 * Method exposed to Grunt Task
 * @param {Array} files - relative file paths
 * @param {object} gruntOptions - merged default options & user options
 * @param {function} done - Kill the grunt task on errors
 */
module.exports.watch = function (files, gruntOptions, done, grunt) {

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

                // When a client connects, give them the options.
                options.id = client.id;

                client.emit("connection", options);

                ua = client.handshake.headers['user-agent'];

                log(messages.connection(parser.setUA(ua).getBrowser()), false);

                // Set up ghost mode
                setLocationTracking(io, client, options);

            });

            // Find a free port for our custom client script
            portScanner.findAPortNotInUse(3000, 3020, 'localhost', function (error, scriptPort) {
                callback(null, io, getHostIp(options), socketIoPort, scriptPort);
            });

        },
        function (io, hostIp, socketIoPort, scriptPort, callback) {

            // Serve Custom Client-side JS
            serveCustomScript(hostIp, socketIoPort, scriptPort, options, grunt);

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
 * Get the external HostIp
 * @returns {*}
 */
var getHostIp = function (options) {

    if (options.host) {
        return options.host;
    }

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
module.exports.getHostIp = getHostIp;
module.exports.changeFile = changeFile;