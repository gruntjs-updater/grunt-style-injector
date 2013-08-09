(function (io) {

    var socket = io.connect('http://REMOVE');

    var ghost = {};

    var target = function (evt) {
        return evt.target || evt.srcElement;
    };

    ghost.id = Math.random();
    ghost.eventListener = (window.addEventListener) ? "addEventListener" : "attachEvent";
    ghost.prefix = (window.addEventListener) ? "" : "on";

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
        var elem = document.getElementById(data.id);
        elem.value = data.value;
    });

    socket.on("connection", function (options) {
        processOptions(options);
    });

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
        var scrollTop = document.getScroll()[1];
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
        if (targetElem.type === "text") {
            targetElem[ghost.eventListener](ghost.prefix+"keyup", keyupCallback, false);
        }
    };

    /**
     * Keyup Call back - inform all browsers
     * @param evt
     */
    var keyupCallback = function (evt) {
        socket.emit("input:type", { id: evt.target.id, value: evt.target.value });
    };

    /**
     * Watch for input focus on form element
     */
    var inputBlurCallback = function(evt) {
        if (evt.target.type === "text") {
//            target(evt).
//            evt.target.removeEventListener("keyup");
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

        // Form Filling
        var inputs = document.getElementsByTagName("input");
        addEvents(inputs, "focus", inputFocusCallback);
        addEvents(inputs, "blur", inputBlurCallback);

    };

    /**
     * Click Call Back
     * @param e
     */
    var clickCallback = function (e) {

        var elem = e.target || e.srcElement;
        socket.emit("location", { url: elem.href });

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