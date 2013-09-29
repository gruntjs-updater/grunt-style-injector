var si = require("../../tasks/lib/style-injector");
var messages = require("../../tasks/lib/messages");

var userOptions = {
    key: "value"
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

describe("Main INIT method", function () {

    var styleInjector;

    beforeEach(function () {
        styleInjector = new si();
    });

    it("can call getPorts first", function () {
        spyOn(styleInjector, "getPorts");
//
        setTimeout(function () {
            styleInjector.init(testFile);
        }, 10);
//
        waits(100);

        runs(function () {
            expect(styleInjector.getPorts).toHaveBeenCalled();
        });
    });
});

