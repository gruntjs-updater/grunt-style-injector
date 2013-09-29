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
 * @param data
 */
//var updateLocations = function (data) {
//    log(messages.location(data.url), false);
//    this.broadcast.emit("location:update", { url: data.url });
//};
//
///**
// * Update scroll position of browsers.
// * @param data
// */
//var updateScrollPosition = function (data) {
//    this.broadcast.emit("scroll:update", { position: data.pos, ghostId: data.ghostId, url: data.url});
//};
//
///**
// * Update a text input;
// * @param data
// */
//var updateFormField = function (data) {
//    this.broadcast.emit("input:update", { id: data.id, value: data.value });
//};
//
///**
// * Update a select element
// * @param data
// */
//var updateSelectField = function (data) {
//    this.broadcast.emit("input:update", { id: data.id, value: data.value });
//};
//
///**
// * Update Radio Field
// * @param data
// */
//var updateRadioField = function (data) {
//    this.broadcast.emit("input:update:radio", { id: data.id, value: data.value });
//};
//
///**
// * Update Checkbox
// * @param data
// */
//var updateCheckboxField = function (data) {
//    this.broadcast.emit("input:update:checkbox", { id: data.id, checked: data.checked });
//};
//
///**
// * Submit a form
// * @param data
// */
//var submitForm = function (data) {
//    this.broadcast.emit("form:submit", { id: data.id });
//};

/**
 * If ghostMode was enabled, inform all browsers when any of them changes URL.
 * @param io
 * @param client
 * @param options
 */
//var setLocationTracking = function (io, client, options) {
//
//    // remember the context of the client that emitted the event.
//    if (options.ghostMode) {
//        client.on("location", updateLocations);
//        client.on("scroll", updateScrollPosition);
//        client.on("input:type", updateFormField);
//        client.on("input:select", updateSelectField);
//        client.on("input:radio", updateRadioField);
//        client.on("input:checkbox", updateCheckboxField);
//        client.on("form:submit", submitForm);
//    }
//};

/**
 * Main methods exposed for testing
 * @type {{}}
 */
var styleInjector = function(){};

//styleInjector.options = {
//
//};
//
//var io;
//var files;


styleInjector.prototype = {
    options: {
        injectFileTypes: ['css', 'png', 'jpg', 'svg', 'gif']
    },
    init: function (files, options) {
        var _this = this;

        this.getPorts(2, function (ports) {
//            _this.setupSocket();
        }, options);
    },
    /**
     * Get two available Ports
     * @param {number} limit
     * @param {function} callback
     * @param options
     */
    getPorts: function (limit, callback, options) {

        var ports = [];

        // get a port (async)
        var getPort = function (start) {
            portScanner.findAPortNotInUse(start + 1, 4000, 'localhost', function (error, port) {
                ports.push(port);
                runAgain();
            });
        };

        // run again if number of ports not reached
        var runAgain = function () {
            if (ports.length < limit) {
                getPort(ports[0]);
            } else {
                return callback(ports);
            }
            return false;
        };

        // Get the first port
        getPort(2999);

    },
    /**
     * Set up the socket.io server
     * @param ports
     * @param userOptions
     * @returns {*}
     */
    setupSocket: function (ports, userOptions) {

        var ua;
        var _this = this;

        io = require('socket.io').listen(ports[0]);
        io.set('log level', 0);

        return io;
    },
    /**
     * Things to do when a client connects
     * @param {array} events
     * @param {object} userOptions
     * @param {function} handle
     */
    handleSocketConnection: function (events, userOptions, handle) {

        var _this = this;
        var ua;

        io.sockets.on("connection", function (client) {

            // set ghostmode callbacks
            if (userOptions.ghostMode) {
                for (var i = 0, n = events.length; i < n; i += 1) {
                    handle(client, events[i], userOptions);
                }
            }

            ua = client.handshake.headers['user-agent'];
            _this.logConnection(ua, userOptions);
        });
    },
    /**
     * Add a client event & it's callback
     * @param {object} client
     * @param {string} event
     * @param {object} userOptions
     */
    handleClientSocketEvent: function (client, event, userOptions) {
        client.on(event.name, function (client) {
            event.callback(io, client, userOptions);
        });
    },
    /**
     * Kill the current socket IO server
     */
    killSocket: function () {
        return io.server.close();
    },
    /**
     * Log a successful client connection
     * @param {object} ua
     * @param {object} userOptions
     */
    logConnection: function (ua, userOptions) {
        this.log(messages.connection(parser.setUA(ua).getBrowser()), userOptions, true);
    },
    callbacks: {
//        connection: function (io, client, userOptions, context) {
//
//            // When a client connects, give them the options.
//            options.id = client.id;
//
//            client.emit("connection", options);
//
//            var ua = client.handshake.headers['user-agent'];
//
//            log(messages.connection(parser.setUA(ua).getBrowser()), false);
//
//            // Set up ghost mode
//            context.setupGhostMode(client, options);
//        }
    },
    /**
     * Helper to try to retrieve the correct external IP for host
     * @param {object} options
     * @returns {string} - the IP address
     */
    getHostIp: function (options) {

        if (options && options.hostIp) {
            return options.hostIp;
        }

        var os = require('os');
        var networkInterfaces = os.networkInterfaces();
        var externalIp = null;

        // loop through results and check that it's an IPv4 address & it's not internal
        _.each(networkInterfaces, function (_interface) {
            return _.each(_interface, function (address) {
                if (address.internal === false && address.family === "IPv4") {
                    externalIp = address.address;
                }
            });
        });

        return externalIp;
    },
    /**
     * Take the path provided in options & transform into CWD for serving files
     * @param {string} baseDir
     * @returns {string}
     */
    getBaseDir: function (baseDir) {

        var suffix = "";

        if (!baseDir || baseDir === "./" || baseDir === "/" || baseDir === ".") {
            return process.cwd();
        } else {
            if (baseDir[0] === "/") {
                suffix = baseDir;
            } else {
                if (baseDir[0] === "." && baseDir[1] === "/") {
                    suffix = baseDir.replace(".", "");
                } else {
                    suffix = "/" + baseDir;
                }
            }
        }

        return process.cwd() + suffix;
    },
    /**
     * Expose messages for tests
     * @returns {*|exports}
     */
    getMessages: function () {
        return messages;
    },
    /**
     * Log a message to the console
     * @param {string} msg
     * @param {object} options
     * @param {boolean} override
     * @returns {boolean}
     */
    log: function (msg, options, override) {

        if (!options.debugInfo && !override) {
            return false;
        }

        return console.log(msg);
    },
    /**
     * @param {string} path
     * @param {socket} io
     * @param {object} options
     * @returns {{assetFileName: string}}
     */
    changeFile: function (path, io, options) {

        var fileName = filePath.basename(path),
                fileExtension = this.getFileExtension(fileName);

        var data = {
            assetFileName: fileName,
            fileExtension: fileExtension
        };

        var message = "inject";

        if (!_.contains(options.injectFileTypes, fileExtension)) {
            data.url = path;
            message = "reload";
        }

        // emit the event through socket
        io.sockets.emit("reload", data);

        // log the message to the console
        this.log(messages.browser[message](), options, false);

        return data;
    },
    /**
     * Launch the server for serving the client JS plus static files
     * @param {string} host
     * @param {array} ports
     * @param {object} options
     * @returns {*|http.Server}
     */
    launchServer: function (host, ports, options) {

        var modifySnippet = function (req, res) {
            res.setHeader("Content-Type", "text/javascript");
            res.end(messages.socketConnector(host, ports[0]) + scriptData);
        };

        var app;
        if (!options.server) {
            app = connect().use(messages.clientScript, modifySnippet);
        } else {

            // serve static files
            loadSnippet.setVars(host, ports[0], ports[1]);
            var baseDir = options.server.baseDir || "./";

            app = connect()
                    .use(messages.clientScript, modifySnippet)
                    .use(loadSnippet.middleWare)
                    .use(connect.static(filePath.resolve(baseDir)));
        }

        var server = http.createServer(app).listen(ports[1]);
        var msg;

        if (options.server) {
            msg = messages.initServer(host, ports[1], this.getBaseDir(options.server.baseDir || "./"), options);
            this.openBrowser(host, ports[1]);
        } else {
            msg = messages.init(host, ports[0], ports[1]);
        }

        this.log(msg, options, true);

        return server;
    },
    /**
     * Open the page in browser
     * _todo uncomment after testing done
     * @param host
     * @param port
     */
    openBrowser: function (host, port) {
//        var open = require("open");
//        open("http://"+host+":"+port);
    },
    /**
     * Proxy for chokidar watching files
     * @param {array|string} files
     * @param {object} io
     * @param {function} callback
     */
    watchFiles: function (files, io, callback) {

        var watcher = chokidar.watch(files, {ignored: /^\./, persistent: true});

        watcher.on('change', function (filepath) {
            callback(filepath, io);
        });
    },

    getFileExtension: function (path) {
        return filePath.extname(path).replace(".", "");
    }
};

module.exports = styleInjector;