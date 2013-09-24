var si = require("../../tasks/lib/style-injector");

describe("a suite", function () {

    it("can be loaded", function () {
        expect(si).toBeDefined();
    });

    describe("getting the Host IP", function () {

        it("can retrieve the correct host IP address", function () {

            expect(si.getHostIp({})).toBe("192.168.0.7");
        });
    });

    describe("getting the file extension", function () {
        it("can get a file extension", function () {
            expect(si.getExtension("core/strings/style.css")).toBe("css");
        });
    });
});
