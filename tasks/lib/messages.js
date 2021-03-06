var clc = require("cli-color");
var exec = require("child_process").exec;

module.exports = {
        connection: function (browser) {
            return clc.cyan("Browser Connected! (" + browser.name + ", version: " + browser.version + ")");
        },
        init: function (hostIp, socketIoPort, scriptPort) {
            return clc.yellow('\n\nAll Set Up! Now copy & paste this snippet just before the closing </body> tag in your website.\n\n')
                    + this.scriptTags(hostIp, socketIoPort, scriptPort, false);
        },
        initServer: function (hostIp, scriptPort, baseDir, options) {

            return clc.green("\nOK, Server running at ") + clc.magenta("http://" + hostIp + ":" + scriptPort +"\n\n") +
                    clc.green("Serving files from: ") + clc.magenta(baseDir) + "\n\n" +
                    clc.green("Go load a browser & check back here. If you set up everthing correctly, you'll see a " +
                            "'Browser Connected' message.\n");
        },
        scriptTags : function (hostIp, socketIoPort, scriptPort, colors) {
            var tags = "<script src='http://" + hostIp + ":" + socketIoPort + this.socketIoScript + "'></script>\n" +
                    "<script src='http://" + hostIp + ":" + scriptPort + this.clientScript + "'></script>\n\n";

            if (colors) {
                return clc.magenta(tags);
            }

            return tags;
        },
        invalidBaseDir: function () {
            return clc.cyan("Invalid Base Directory path for server. ( baseDir: )\n\n") +
                    clc.green("TIP: Don't use a forward slash at the beginning, and if you " +
                    "want to serve files from the root folder, just set the baseDir option to './' ");
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
        },
        location: function (url) {
            return clc.yellow("Link clicked! Redirecting all browser to " + clc.green(url));
        },
        socketConnector: function (host, port) {
            return "var ___socket___ = io.connect('" + host + ":" + port + "');";
        },
        clientScript: "/style-injector-client.min.js",
        socketIoScript: "/socket.io/socket.io.js"
};