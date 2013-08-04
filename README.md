# grunt-style-injector

> A live-reload alternative with support for legacy IE browsers.

## Getting Started
This plugin requires Grunt `~0.4.1`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins.

##About
This plugin gives you live style-injecting into all browsers. It also provides live-reloading of files that cannot be injected (php, html etc). I was inspired to build this because the popular live-reload plugin does not work with IE 7 & 8. *This one does!*


##Install


```shell
npm install grunt-style-injector --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-style-injector');
```
##Config
Here's an example of the simplest configuration possible (options are explained below)

```
styleinjector: {
    files: {
        src : 'assets/css/style.css'
    },
},
```

##Run

`grunt styleinjector`

When you run this command you'll receive a html snippet in the command line, paste this into your website directly before the closing `</body>` tag & you'll be good to go.

##Options

Here's another example config with options, each will be explained after.

```
styleinjector: {
    files: {
        src : 'assets/css/style.css'
    },
    options: {
        watchTask: false,
        debugInfo: true,
        urlTransforms: {
            remove: "test/fixtures/"
        },
        host: "192.168.0.7"
    },
},
```
###watchTask (default: *false*)
Style-Injector is not a replacement for regular `watch` tasks (such as compiling SASS, LESS etc), they are designed to be used together. If you intend to do this, set this option to true and be sure to call the `watch` task AFTER `styleinjector`. For example, to compile SASS and then inject the CSS into all open browsers (without a page refresh), your config for all three tasks might look something like this:

```
module.exports = function (grunt) {

    grunt.initConfig({
        watch: {
            files: "assets/scss/**/*.scss",
            tasks: ['compass'],
        },
        compass: {
            dist: {
                options: {
                    sassDir: 'assets/scss',
                    cssDir: 'assets/css',
                    outputStyle: 'compressed',
                },
            },
        },
        styleinjector: {
            files: {
                src : 'assets/css/*.css',
            },
            options: {
                watchTask: true,
            },
        },
    });

    // load npm tasks
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-style-injector');

    // create custom task-list
    grunt.registerTask('default', ["styleinjector", "watch"]);

};
```

###debugInfo (default: *true*)
By default, the task will inform you when a file has been changed & when browsers are connected. This can sometimes cause a lot of output to the console and if you don't want that, set this option to false.

###urlTransforms (default: null)
Style-Injector works by looking for the changed file-name in the current page & because you need to reference files *relative* to your Gruntfile, there may be parts of the file-path that stop it working. `urlTransforms` allows you to specify parts of the file-path to remove. For example:

```
grunt.initConfig({
    styleinjector: {
        files: {
            src : 'app/assets/css/*.css',
        },
        options: {
            urlTransforms: {
                remove : "app",
            },
        },
    },
});

// Needed because the CSS file url will probably look like this in the DOM.
// <link rel="stylesheet" href="/assets/css/style.css"/>
```

###host (default: *null*)
Style-Injector will sort this for you, but if you have a reason to specify a host, you can do so here. For example:

```
grunt.initConfig({
    styleinjector: {
        files: {
            src : 'app/assets/css/*.css',
        },
        options: {
            host : "192.168.0.1"
        },
    },
});
```

> A quick word on hosts...
The power of Style-Injector comes when you have multiple devices/browsers connected. To do this, you use your networks IP instead of `localhost`. For example, you may have a php/node/mamp server running at `localhost:8000`. Swap out the localhost part for something like `192.168.0.1` (find yours by running `ifconfig` on Mac, `ipconfig` on Windows) and you can connect to **192.168.0.1:8000**. Now, with Style-Injector running, you can have as many browsers/devices connected and they will all live-update when you change a file.

##Live Reload
Style-Injector will, as the name implies, inject CSS into all connected browsers without reloading the page. It even works on VMs running IE 7 & 8! But that's not all it does. It can also live-inject jpg & png files too, as well as perform a hard refresh for JS, PHP, HTML files etc. For example:

```
grunt.initConfig({
    styleinjector: {
        files: {
            src : [
                'assets/css/*.css',
                'assets/img/**/*.jpg',
                'assets/img/**/*.png',
                'assets/js/**/*.js',
                '**/*.php',
                '**/*.html',
            ],
        },
    },
});
```

###Support
Please contact me (raise an issue) if you have any problems getting up and running with this. I'll be happy to help :)

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
0.1.0 - initial release
