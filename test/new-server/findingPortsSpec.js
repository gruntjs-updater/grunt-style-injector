var si = require("../../tasks/lib/style-injector");
var messages = require("../../tasks/lib/messages");
var methods = new si();

var options = si.options;

describe("finding free ports", function () {

    it("should return ports two available ports", function () {

        var cb = jasmine.createSpy();

        var ports;

        var context = function () {

        };

        setTimeout(function () {
            ports = methods.getPorts(2, cb, {});
        }, 10);

        waits(100);

        runs(function () {
            expect(cb).toHaveBeenCalledWith([3000, 3001]);
        });
    });
});