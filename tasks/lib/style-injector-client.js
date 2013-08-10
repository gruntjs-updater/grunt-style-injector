(function (io) {

    var socket = io.connect('http://REMOVE');

    var ghost = {};
    ghost.id = Math.random();
    ghost.eventListener = (window.addEventListener) ? "addEventListener" : "attachEvent";
    ghost.removeEventListener = (window.removeEventListener) ? "removeEventListener" : "detachEvent";
    ghost.prefix = (window.addEventListener) ? "" : "on";
    ghost.cache = {};

    socket.on('reload', function (data) {
        if (data) {
            if (data.url) {
                location.reload();
            } else {
                swapFile(data.assetUrl, getTagName(data.fileExtention));
            }
        }
    });

    socket.on('location:update', function (data) {
        if (data.url) {
            window.location = data.url;
        }
    });

    socket.on("scroll:update", function (data) {
        ghost.disabled = true;
        window.scrollTo(0, data.position);
    });

    socket.on("input:update", function (data) {
        ghost.disabled = true;
        var elem = checkCache(data.id);
        elem.value = data.value;
    });

    socket.on("connection", function (options) {
        processOptions(options);
    });

    /**
     * Check if we've already had access to this element.
     * @param {string} id
     * @returns {boolean|HTMLElement}
     */
    var checkCache = function (id) {
        var elem;
        if (ghost.cache[id]) {
            return ghost.cache[id].elem;
        } else {
            elem = document.getElementById(id);
            if (elem) {
                ghost.cache[id] = {};
                ghost.cache[id].elem = document.getElementById(id);
                return elem;
            } else return false;
        }
    };

    /**
     * Helper to retieve the elem on which an event was triggered
     * @param evt
     * @returns {HTMLHtmlElement}
     */
    var target = function (evt) {
        return evt.target || evt.srcElement;
    };

    /**
     * Process options retrieved from grunt.
     * @param options
     */
    var processOptions = function (options) {
        if (options.ghostMode) {
            initGhostMode(options.ghostMode);
        }
        ghost.id = options.id;
    };

    /**
     * Attempt to keep browser scroll Positions in check.
     * @param evt
     */
    var scrollListener = function (evt) {
        var scrollTop = document.getScroll()[1]; // Get y position of scroll
        if (!ghost) {
            ghost.scrollTop = scrollTop[0];
        } else {
            if (!ghost.disabled) {
                socket.emit("scroll", { pos: scrollTop, ghostId: ghost.id });
            }
            ghost.scrollTop = scrollTop;
        }
        ghost.disabled = false;
    };

    document.getScroll= function(){
        if(window.pageYOffset!= undefined){
            return [pageXOffset, pageYOffset];
        }
        else{
            var sx, sy, d= document, r= d.documentElement, b= d.body;
            sx= r.scrollLeft || b.scrollLeft || 0;
            sy= r.scrollTop || b.scrollTop || 0;
            return [sx, sy];
        }
    };

    /**
     * Watch for input focus on form element
     */
    var inputFocusCallback = function(evt) {
        var targetElem = target(evt);
        socket.emit("input:focus", { id: targetElem.id }); // Todo - Is this needed?
        if (targetElem.type === "text" || targetElem.type === "textarea") {
            targetElem[ghost.eventListener](ghost.prefix+"keyup", keyupCallback, false);
        }
    };

    /**
     * Keyup Call back - inform all browsers
     * @param evt
     */
    var keyupCallback = function (evt) {
        var elem = target(evt);
        socket.emit("input:type", { id: elem.id, value: elem.value });
    };

    /**
     * Watch for input focus on form element
     */
    var inputBlurCallback = function(evt) {
        var targetElem = target(evt);
        if (targetElem.type === "text") {
            targetElem[ghost.removeEventListener]("keyup");
        }
    };


    /**
     * Helper to attach events in a cross-browser manner.
     * @param elems
     * @param event
     * @param callback
     */
    var addEvents = function (elems, event, callback) {
        for (var i = 0, n = elems.length; i < n; i += 1) {
            elems[i][ghost.eventListener](ghost.prefix+event, callback, false);
        }
    };

    /**
     * Select Box changes
     * @param evt
     */
    var selectChangeCallback = function(evt) {
        var targetElem = target(evt);
        socket.emit("input:select", { id: targetElem.id, value: targetElem.value });
    };

    /**
     * Initi Ghost mode
     */
    var initGhostMode = function (ghostMode) {

        // Scroll event
        if (ghostMode.scroll) {
            window[ghost.eventListener](ghost.prefix+"scroll", scrollListener, false);
        }

        if (ghostMode.links) {
            // Add click handler to links.
            var links = document.getElementsByTagName("a");
            addEvents(links, "click", clickCallback);
        }

        if (ghostMode.forms) {
            // Form Filling
            var inputs = document.getElementsByTagName("input");
            addEvents(inputs, "focus", inputFocusCallback);
            addEvents(inputs, "blur", inputBlurCallback);

            var textAreas = document.getElementsByTagName("textarea");
            addEvents(textAreas, "focus", inputFocusCallback);
            addEvents(textAreas, "blur", inputBlurCallback);

            var selects = document.getElementsByTagName("select");
            addEvents(selects, "change", selectChangeCallback);
        }


    };

    /**
     * Walk backwards through the dom to find the clicked links href value in
     * ie7/8
     * @param {HTMLHtmlElement} elem
     * @param {number} parentLimit
     * @returns {*}
     */
    var getParentHref = function(elem, parentLimit) {

        var getHref = function (elem) {
            if (elem.parentNode.tagName === "A") {
                return elem.parentNode.href
            } else {
                return elem.parentNode;
            }
        };

        var looperElem;
        var currentElem = elem;
        for (var i = 0; i < parentLimit; i += 1) {
            looperElem = getHref(currentElem);
            if (typeof looperElem === "string") {
                return looperElem;
            } else {
                currentElem = looperElem;
            }
        }
        return false;
    };

    /**
     * Click Call Back
     * @param e
     */
    var clickCallback = function (e) {

        var elem = e.target || e.srcElement;
        var tagName = elem.tagName;
        var href;

        if (this.href) { // Catch the href
            href = this.href;
        } else {
            if (tagName === "A") {
                href = elem.href;
            } else {
                // IE 7/8 find the parent Anchor element
                href = getParentHref(elem, 5);
            }
        }
        if (href) {
            socket.emit("location", { url: href });
        }
    };


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


    /**
     *
     * @param {NodeList} tags - array of
     * @param {string} url
     * @returns {Array}
     * @param {string} attr
     */
    function getMatch(tags, url, attr) {

        var matches = [], shortregex = new RegExp(url);

        for (var i = 0, len = tags.length; i < len; i += 1) {
            var match = shortregex.exec(tags[i][attr]);
            if (match) {
                matches.push(i);
            }
        }

        return matches;
    }

    /**
     * Get HTML tags
     * @param tagName
     * @returns {NodeList}
     */
    function getTags(tagName) {
        return document.getElementsByTagName(tagName);
    }

    /**
     *
     * Get Tag Name from file extension
     *
     */
    function getTagName(fileExtention) {
        return options.tagNames[fileExtention.replace(".", "")];
    }

    /**
     * Swap the File in the DOM
     * @param {string} url
     * @param {string} tagName
     */
    function swapFile(url, tagName) {
        var elems = getTags(tagName),
                attr = options.attrs[tagName];

        if (elems) {
            var match = getMatch(elems, url, attr);
            if (match) {
                updateElem(elems[match], attr);
            }
        }
    }

    /**
     * Update the Dom Elem with the new time stamp
     * @param elem
     * @param attr
     */
    function updateElem(elem, attr) {
        var currentSrc = elem[attr];

        // test if there's already a timestamp on the url
        var justUrl = /^[^\?]+(?=\?)/.exec(currentSrc);

        if (justUrl) {
            currentSrc = justUrl;
        }
        elem[attr] = currentSrc + "?rel=" + new Date().getTime();
    }

}(io));