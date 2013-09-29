var si = require("../../tasks/lib/style-injector");
var clientIo = require("socket.io-client");
var messages = require("../../tasks/lib/messages");
var styleInjector = new si();
var userOptions = {
    ghostMode: true
};
var testFile = "test/fixtures/test.txt";

var done = function () {
    console.log("done");
};

var grunt = {
    fail: {
        fatal: function () {}
    }
};

describe("setup Socket", function () {

    var ports = [3001,3002];
    var io;
    var cb;
    var cb2;
    var cb3;
    var events;

    beforeEach(function () {
        cb = jasmine.createSpy("1");
        cb2 = jasmine.createSpy("2");
        cb3 = jasmine.createSpy("3");

        events = [
            {
                name: "random",
                callback: cb
            },
            {
                name: "inputchange",
                callback: cb2
            }
        ];

        io = styleInjector.setupSocket(ports, userOptions);
        styleInjector.handleSocketConnection(events, userOptions, styleInjector.handleClientSocketEvent);

    });

    it("can start the socket IO server", function () {
        expect(io.sockets).toBeDefined();
        styleInjector.killSocket();
    });

    it("can listen for client events when ghostmode Enabled", function () {

        var socket;

        setTimeout(function () {
            socket = clientIo.connect("http://localhost:" + ports[0], {'force new connection':true});
            socket.emit("inputchange", {});
            socket.emit("random", {});
        }, 100);

        waits(200);

        runs(function () {
            expect(cb2).toHaveBeenCalled();
            expect(cb).toHaveBeenCalled();
        });
    });
    it("can log a new connection", function () {

        var socket;

        spyOn(styleInjector, 'logConnection');

        setTimeout(function () {
            socket = clientIo.connect("http://localhost:" + ports[0], {'force new connection':true});
        }, 100);

        waits(200);

        runs(function () {
            expect(styleInjector.logConnection).toHaveBeenCalled();
        });
    });
});

