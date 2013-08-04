'use strict';

var grunt = require('grunt');
var si = require('../lib/style-injector.js');

/*
 ======== A Handy Little Nodeunit Reference ========
 https://github.com/caolan/nodeunit

 Test methods:
 test.expect(numAssertions)
 test.done()
 Test assertions:
 test.ok(value, [message])
 test.equal(actual, expected, [message])
 test.notEqual(actual, expected, [message])
 test.deepEqual(actual, expected, [message])
 test.notDeepEqual(actual, expected, [message])
 test.strictEqual(actual, expected, [message])
 test.notStrictEqual(actual, expected, [message])
 test.throws(block, [error], [message])
 test.doesNotThrow(block, [error], [message])
 test.ifError(value)
 */

exports.style_injector = {
    setUp: function (done) {
        // setup here if necessary
        done();
    },
    transformUrl: function (test) {

        test.expect(3);
        var actual = si.transformUrl("build/assets/css/style.css", {remove: "build/assets"});
        var expected = "/css/style.css";
        test.equal(actual, expected, 'Remove sections of relative strings not present in URL');

        actual = si.transformUrl("build/assets/css/style.css", {prefix: "/"});
        expected = "/build/assets/css/style.css";
        test.equal(actual, expected, 'Add a prefix to a url');

        actual = si.transformUrl("build/assets/css/style.css", {prefix: "/public", remove: "build/assets"});
        expected = "/public/css/style.css";
        test.equal(actual, expected, 'Remove sections of string and replace with a prefix');

        test.done();

    },
    getHostIp: function (test) {
        test.expect(1);

        var actual = si.getHostIp();

        // Manually entered to ENSURE we are getting exactly the result we want. Change to your own IP to test
        var expected = "192.168.0.7";

        test.equal(actual, expected, 'Detect Publicly accessible IP');

        test.done();
    }
};
