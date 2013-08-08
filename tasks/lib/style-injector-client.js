(function (io) {

    var socket = io.connect('http://REMOVE');

    var ghost = {};

    ghost.id = Math.random();

    var event = (window.addEventListener) ? "addEventListener" : "attachEvent";
    var prefix = (window.addEventListener) ? "" : "on";

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
     * Initi Ghost mode
     */
    var initGhostMode = function (ghostMode) {

        // Scroll event
        if (ghostMode.scroll) {
            window[event](prefix+"scroll", scrollListener, false);
        }

        if (ghostMode.links) {
            // Add click handler to links.
            var links = document.getElementsByTagName("a");
            for (var i = 0, n = links.length; i < n; i += 1) {
                links[i][event](prefix+"click", clickCallback, false);
            }
        }
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