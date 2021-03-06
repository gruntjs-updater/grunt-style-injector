# grunt-style-injector [![Build Status](https://travis-ci.org/shakyShane/grunt-style-injector.png?branch=master)](https://travis-ci.org/shakyShane/grunt-style-injector)

#Deprecated - This project is now [grunt-browser-sync](https://github.com/shakyShane/grunt-browser-sync)

(meaning this one is no-longer supported/updated)

---

> A live-reload alternative with support for legacy IE browsers.

## Getting Started
This plugin requires Grunt `~0.4.1`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins.

##About
**Live CSS-injecting with NO page refresh**

This plugin gives you live style-injecting into all browsers. It also provides live-reloading of files that cannot be injected (php, html etc). I was inspired to build this because the popular live-reload plugin does not work with IE 7 & 8. *This one does!*

It can also be used in **Ghost-Mode** where all connected broswers/devices will try to keep in sync. Ghost-Mode currently supports three options:

**links**  - When you click a link in one browser (say, Chrome on desktop), all of the other browsers you have open will navigate to the same link.

**scroll** - When you scroll a website in one browser, all the others will follow suit. (very useful when developing with multiple monitors/devices )

**forms**  - When you fill out a form, all connected browsers will populate their forms with what you type in real-time. (currently working for
text-inputs, text areas, selects, radios & checkboxes)

##Install

```shell
npm install grunt-style-injector --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-style-injector');
```
##Config
Here's an example of the simplest configuration possible. This will give you a HTML snippet to paste into your website & will you allow you to work with any server setup (such as MAMP,  WAMP or anything else). So if you are working on a Wordpress website, for example, this is the option for you.

```
styleinjector: {
    files: {
        src : 'assets/css/style.css'
    },
},
```
## with Connect Server
If you want the zero-effort version, just include the `server` option and provide the base directory to your public files. Using this option does NOT require the HTML snippet as the Style Injector will inject it automatically into the pages it serves for you.

```
styleinjector: {
    files: {
        src : 'assets/css/style.css'
    },
    options: {
    	server: {
    		baseDir: "app"
    	}
    }
},
```

##Run

`grunt styleinjector`

When you've used one of the configs from above, run this command from the terminal and you'll be good to go (if you are using the built-in server). If you are not using the built in server, (because your site is on PHP or something else), just grab the HTML snippet from the command line and paste it into your site just before the closing `</body` tag

##Options

Here's another example config with options, each will be explained after.

```js
styleinjector: {
    files: {
        src : 'assets/css/style.css'
    },
    options: {
        watchTask: false,
        debugInfo: true,
        host: "192.168.0.7",
        server: {
        	baseDir: "app"
        }
    },
},
```
###watchTask (default: *false*)
Style-Injector is not a replacement for regular `watch` tasks (such as compiling SASS, LESS etc), they are designed to be used together. If you intend to do this, set this option to true and be sure to call the `watch` task AFTER `styleinjector`. For example, to compile SASS and then inject the CSS into all open browsers (without a page refresh), your config for all three tasks might look something like this:


```js
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

```js
grunt.initConfig({
    styleinjector: {
        files: {
            src : 'app/assets/css/*.css',
        },
    },
});

// Needed because the CSS file url will probably look like this in the DOM.
// <link rel="stylesheet" href="/assets/css/style.css"/>
```

###host (default: *null*)
Style-Injector will attempt to figure out the correct external IP to use on your network. Ocassionally though, it may select
one that cannot be accessed on any other devices (just the machine you are developing on). If this happens, and you know exactly
which IP to use on your network, you can plug it in here.

For example:

```js
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

###ghostMode (default: *false*) **Experimental**
There are currently three options for **ghostMode** `scroll`, `links` & `forms`

- Scroll. Enable this and your connected browsers will attempt to keep in sync
- Links. Enable this and your connected browsers will follow each other around. (note: this could be problematic if you already have click events
on `<a>` elements. It's designed to just make it easy to view multiple pages in the same site and have all browsers keep in sync while in development.
- Forms Enable this and your connected browsers will keep all form inputs in sync

```js
grunt.initConfig({
    styleinjector: {
        files: {
            src : 'app/assets/css/*.css',
        },
        options: {
            host : "192.168.0.1",
            ghostMode: {
                scroll: true,
                links: true,
                forms: true
            }
        },
    },
});
```
###server (default: *false*)
Using the `server` option negates the need for the HTML snippet as it will be injected automatically (no browser plugins needed!). Just provide the base directory where you want to serve your files from and you'll be good to go!.

```js
grunt.initConfig({
    styleinjector: {
        files: {
            src : 'app/assets/css/*.css',
        },
        options: {
            host : "192.168.0.1",
			server: {
        		baseDir: "app"
        	}
        },
    },
});
```

##Live Reload
Style-Injector will, as the name implies, inject CSS into all connected browsers without reloading the page. It even works on VMs running IE 7 & 8! But that's not all it does. It can also live-inject jpg & png files too, as well as perform a hard refresh for JS, PHP, HTML files etc. For example:

```js
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
0.1.1 - Bug fixes release
0.1.3 - Added initial implentation of Ghost-mode (link)
0.1.4 - refined ghost-mode and added scroll
0.1.6 - Added Built-in server with middleware for injecting snippet
0.1.7 - Added 'open' for automatically opening browser when 'server' option is used.