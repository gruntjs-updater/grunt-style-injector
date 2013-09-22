(function (window, socket) {


    var scope = {
        ghostMode: {
            enabled: true
        }
    };

    var styleInjector = function () {};
    var styleInjectorActions = function () {};
    var ghost = function () {};

    (function  () {
        ghost.utils = {}
        ghost.utils.eventListener = (window.addEventListener) ? "addEventListener" : "attachEvent";
        ghost.utils.removeEventListener = (window.removeEventListener) ? "removeEventListener" : "detachEvent";
        ghost.utils.prefix = (window.addEventListener) ? "" : "on";
    })();

    var options = {
        tagNames: {
            "css": "link",
            "jpg": "img",
            "png": "img",
            "svg": "img",
            "gif": "img",
            "js": "script"
        },
        attrs: {
            "link": "href",
            "img": "src",
            "script": "src"
        }
    };

    styleInjector.prototype = {
        processOptions: function (scope, options, utils, listeners) {
            scope.options = options;
            if (options.ghostMode) {
                this.initGhostMode(options.ghostMode, utils, listeners);
            }
        },
        initGhostMode: function (ghostMode, utils, listeners) {
            if (ghostMode.links) {
                ghost.prototype.initClickEvents(scope, utils, listeners.click);
            }

            if (ghostMode.scroll) {
                ghost.prototype.initEvents(scope, ['scroll'], utils, listeners);
            }
        },
        reloadEvent: function (scope, data, actions) {

            var transformedElem;

            if (data.url) {
                actions.reloadBrowser(true);
            }

            if (data.assetFileName) {

                try {
                    if (!data.fileExtension)
                    {
                        throw "Not enough info from server to reload"
                    }
                    var tagName = this.getTagName(data.fileExtension);
                    var attr = this.getAttr(tagName);
                    var elems = document.getElementsByTagName(tagName);

                    var elem = this.getMatches(elems, data.assetFileName, attr);
//
                    transformedElem = actions.swapFile(elem, attr);

                } catch (e) {
//                    console.log(e);
                }
            }

            return transformedElem;
        },
        getTagName: function (fileExtention) {
            return options.tagNames[fileExtention];
        },
        getAttr: function (tagName) {
            return options.attrs[tagName];
        },
        getMatches: function (elems, url, attr) {

            var match;
            for (var i = 0, len = elems.length; i < len; i += 1) {
                if (elems[i][attr].indexOf(url) != -1) {
                    match = i;
                }
            }

            return elems[match] || null;
        }
    };

    styleInjectorActions.prototype = {
        reloadBrowser: function (confirm) {
            if (confirm) {
                location.reload();
            }
        },
        swapFile: function (elem, attr) {

            var currentValue = elem[attr];

            var justUrl = /^[^\?]+(?=\?)/.exec(currentValue);

            if (justUrl) {
                currentValue = justUrl[0];
            }
            var timeStamp = new Date().getTime();
            elem[attr] = currentValue + "?rel=" + timeStamp;

            return { elem: elem, timeStamp: timeStamp };
        }
    };


    /**
     * Ghost Mode
     * @type {{getScroll: Function}}
     */
    ghost.prototype = {
        getScroll: function () {
            if (window.pageYOffset != undefined) {
                return [pageXOffset, pageYOffset];
            }
            else {
                var sx, sy, d = document, r = d.documentElement, b = d.body;
                sx = r.scrollLeft || b.scrollLeft || 0;
                sy = r.scrollTop || b.scrollTop || 0;
                return [sx, sy];
            }
        },
        getScrollTop: function () {
            return this.getScroll()[1];
        },
        setScrollTop: function (ghostMode, y) {
            ghostMode.enabled = false;
            window.scrollTo(0, y);
        },
        syncScrollTop: function (url, y) {
            if (url === window.location.href) {
                this.setScrollTop(y);
            }
        },
        initClickEvents: function (scope, utils, callback) {
            var elems = document.getElementsByTagName("a");
            for (var i = 0, n = elems.length; i < n; i += 1) {
                this.composeElementEvent(elems[i], utils, "click", callback);
            }
        },
        initEvents: function (scope, events, utils, callbacks) {

            var _this = this;
            var evt = "scroll";

            for (var i = 0, n = events.length; i < n; i += 1) {
                if (events[i] === evt) {
                    this.composeSingleEvent(utils, evt, callbacks[evt]);
                }
            }
        },
        /**
         * Make a cross browser event handler system
         * @param utils
         * @param event
         * @param callback
         */
        composeSingleEvent: function (utils, event, callback) {
            window[utils.eventListener](utils.prefix + event, callback, false);
        },
        composeElementEvent: function (elem, utils, event, callback) {
            elem[utils.eventListener](utils.prefix + "click", callback, false);
        },
        /**
         * Emit an event
         * @param {string} name [ the event name sent back to the server ]
         * @param {object} data
         */
        emitEvent: function (name, data) {
            socket.emit(name, data);
        },
        addBrowserEvents: function (elems, event, callback, utils) {
            for (var i = 0, n = elems.length; i < n; i += 1) {
                elems[i][utils.eventListener](utils.prefix + event, callback, false);
            }
        },
        getHref: function (elem, context) {

            var tagName = elem.tagName;
            var href;

            if (context && context.href) {
                href = context.href;
            } else {
                if (tagName === "A") {
                    href = elem.href;
                } else {
                    // IE 7/8 find the parent Anchor element
                    href = this.getParentHref(elem, 5);
                }
            }

            return href;
        },
        /**
         * Walk backwards up the dom until you find the HREF attr of a link.
         * @param {HTMLElement} elem
         * @param {number} limit
         * @returns {string|boolean}
         */
        getParentHref: function (elem, limit) {

            var getHref = function (elem) {
                if (elem.parentNode.tagName === "A") {
                    return elem.parentNode.href
                } else {
                    return elem.parentNode;
                }
            };

            var looperElem;
            var currentElem = elem;

            for (var i = 0; i < limit; i += 1) {
                looperElem = getHref(currentElem);
                if (typeof looperElem === "string") {
                    return looperElem;
                } else {
                    currentElem = looperElem;
                }
            }

            return false;
        },
        listeners: {
            scroll: function () {
                var scrollTop = ghost.prototype.getScrollTop(); // Get y position of scroll
                var newScroll = new Date().getTime();

                if (!scope.ghostMode.lastScroll) {
                    scope.ghostMode.scrollTop = scrollTop[0];
                    scope.ghostMode.lastScroll = new Date().getTime();
                }

                if (newScroll > scope.ghostMode.lastScroll + 50) { // throttle scroll events
                    if (scope.ghostMode.enabled) {
                        scope.ghostMode.lastScroll = newScroll;
                        ghost.prototype.emitEvent("scroll",
                                {
                                    pos: scrollTop, url: window.location.href
                                });
                    }
                }

                scope.ghostMode.enabled = true;
            },
            click: function (event) {
                var data = {
                    url: ghost.prototype.getHref(event.target || event.srcElement, this)
                };
                ghost.prototype.emitEvent("location", data);
            }
        }
    };

    /** Test mode stuff **/
    if (window.__karma__) {
        window.styleInjector = styleInjector;
        window.styleInjectorActions = styleInjectorActions;
        window.ghost = ghost;
        socket.on = function () {};
    }

    /**
     * Process options on connection
     */
    socket.on("connection", function (options) {
        styleInjector.prototype.processOptions(scope, options, ghost.utils, ghost.prototype.listeners);
    });

    // Socket IO events
    socket.on('reload', function (data) {
        if (data) {
            styleInjector.prototype.reloadEvent(scope, data, styleInjectorActions.prototype);
        }
    });

    socket.on('location:update', function (data) {
        if (data.url) {
            window.location = data.url;
        }
    });
    /**
     *
    */
    socket.on("scroll:update", function (data) {
        if (data.url === window.location.href) {
            scope.ghostMode.enabled = false;
            window.scrollTo(0, data.position);
        }
    });

    // If in test mode, expose to the window object to make testing possible.

}(window, (typeof socket ==="undefined") ? {} : socket));