/*
 * grunt-style-injector
 * https://github.com/shakyshane/grunt-style-injector
 *
 * Copyright (c) 2013 Shane Osbourne
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        jshint: {
            all: [
                'Gruntfile.js',
                'tasks/*.js',
                '<%= nodeunit.tests %>'
            ],
            options: {
                jshintrc: '.jshintrc'
            }
        },

        // Before generating any new files, remove any previously-created files.
        clean: {
            tests: ['tmp']
        },
        watch: {
            files: "test/*"
        },
        styleinjector: {
            default_options: {
                files: {
                    src : 'test/**'
                },
                options: {
                    watchTask: false,
                    debugInfo: true,
                    urlTransforms: {
                        remove: "test/fixtures/"
                    },
//                    host: "192.168.0.7",
                    ghostMode: {
                        scroll: true,
                        links: true
                    }
                }
            }
        },
        // Unit tests.
        nodeunit: {
            tests: ['test/*_test.js']
        }
    });

    // Actually load this plugin's task(s).
    grunt.loadTasks('tasks');

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-nodeunit');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Whenever the "test" task is run, first clean the "tmp" dir, then run this
    // plugin's task(s), then test the result.
    grunt.registerTask('test', ['nodeunit']);

    // By default, lint and run all tests.
    grunt.registerTask('default', ["styleinjector", "watch"]);

};
