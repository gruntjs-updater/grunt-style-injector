(function (window) {

    var styleInjector = function () {};
    var styleInjectorActions = function () {};

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
            if (data.url) {
                actions.reloadBrowser();
            }
            if (data.assetFileName) {

                var tagName = this.getTagName(data.fileExtention);
                var attr = this.getAttr(tagName);
                var elems = document.getElementsByTagName(tagName);
                var elem = this.getMatches(elems, data.assetFileName, attr);

                actions.swapFile(elem, data.assetFileName, attr);
            }
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

            elem[attr] = currentValue + "?rel=" + new Date().getTime();

            return elem;
        }
    };

    // If in test mode, expose to the window object to make testing possible.
    if (window.__karma__) {
        window.styleInjector = styleInjector;
        window.styleInjectorActions = styleInjectorActions;
    }

}(window));