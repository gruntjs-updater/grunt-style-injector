var fs = require("fs");
var si = require("../../tasks/lib/style-injector");
var methods = si.methods;
var options = si.options;
var testFile = "test/fixtures/test.txt";

// socket io stub;
var io = {};
io.sockets = {
    emit: function (event, data) {}
};

describe("watching files", function () {

    beforeEach(function(){
        spyOn(methods, "changeFile");
        beforeEach(function(){

        });
    });

    it("should call changeFile when a watched file is changed", function () {

        methods.watchFiles(testFile, io, methods.changeFile);

        setTimeout(function () {
            fs.writeFileSync(testFile, "writing to file", "UTF-8");
        }, 10);

        waits(200);

        runs(function () {
            expect(methods.changeFile).toHaveBeenCalledWith(testFile, io);
        });
    });
});