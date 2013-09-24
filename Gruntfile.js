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
        uglify: {
            files: {
                src: "tasks/lib/style-injector-client.js",
                dest: "tasks/lib/style-injector-client.min.js"
            }
        },
        // Before generating any new files, remove any previously-created files.
        clean: {
            tests: ['tmp']
        },
        watch: {
            server_tests: {
                files: [
                    "test/server/**/*.js",
                    "tasks/lib/**/*.js"
                ],
                tasks: ["jasmine_node"]
            }
        },
        styleinjector: {
            default_options: {
                files: {
                    src : [
                        'test/**'
                    ]
                },
                options: {
                    watchTask: false,
                    debugInfo: true,
                    ghostMode: {
                        scroll: true,
                        links: true,
                        forms: true
                    },
                    server: {
                        baseDir: "test/fixtures"
                    }
                }
            }
        },
        karma: {
            unit: {
                configFile: 'test/karma.conf.js',
                singleRun: true
            }
        },
        // Unit tests.
        nodeunit: {
            tests: ['test/*_test.js']
        },
        jasmine_node: {
            specNameMatcher: "Spec", // load only specs containing specNameMatcher
            projectRoot: "test/server",
            requirejs: false,
            forceExit: true,
            jUnit: {
                report: false,
                savePath : "./build/reports/jasmine/",
                useDotNotation: true,
                consolidate: true
            }
        }
    });

    // Actually load this plugin's task(s).
    grunt.loadTasks('tasks');

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-nodeunit');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-jasmine-node');

    // Whenever the "test" task is run, first clean the "tmp" dir, then run this
    // plugin's task(s), then test the result.
    grunt.registerTask('test', ['karma', 'jasmine_node']);

    // By default, lint and run all tests.
    grunt.registerTask('default', ["styleinjector", "watch"]);

};
