/*
 * grunt-style-injector
 * https://github.com/shakyshane/grunt-style-injector
 *
 * Copyright (c) 2013 Shane Osbourne
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

    grunt.registerMultiTask('styleinjector', 'Your task description goes here.', function () {

        var done = this.async();

        // fail straight away if there are no files to watch!
        //noinspection JSUnresolvedVariable
        if (!this.filesSrc.length) {
            grunt.fail.fatal("StyleInjector could not find any files to watch! (check your config!)");
        }

        var options = this.options({
            urlTransforms: {
                suffix : null,
                remove : null
            },
            debugInfo: true,
            background: false,
            reloadFileTypes: ['php', 'html', 'js', 'erb'],
            injectFileTypes: ['css', 'png', 'jpg', 'svg', 'gif'],
            host: null,
            server: false,
            open: true
        });

        //noinspection JSUnresolvedVariable,JSCheckFunctionSignatures

        var si = require('./lib/style-injector.js');
        var styleInjector = new si();

        styleInjector.init(this.filesSrc, options);

        //noinspection JSUnresolvedVariable
        if (options.watchTask || options.background) {
            done(); // Allow Watch task to run after
        }
    });
};