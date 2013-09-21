(function (window, socket) {

    var scope = {
        options: {
            ghostMode: false
        }
    };

    var styleInjector = function () {};
    var styleInjectorActions = function () {};
    var ghost = function () {};

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
        processOptions: function (scope, options) {
            scope.options = options;
            if (options.ghostMode) {
                this.initGhostMode();
            }
        },
        initGhostMode: function () {

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
        emitEvent: function () {

        }
    };


    if (window.__karma__) {
        window.styleInjector = styleInjector;
        window.styleInjectorActions = styleInjectorActions;
        window.ghost = ghost;
        socket.on = function () {};
    }

    // Socket IO events
    socket.on('reload', function (data) {
        if (data) {
            styleInjector.prototype.reloadEvent(scope, data, styleInjectorActions.prototype);
        }
    });

    // If in test mode, expose to the window object to make testing possible.

}(window, (typeof socket ==="undefined") ? {} : socket));