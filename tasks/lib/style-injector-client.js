(function (io) {

    var socket = io.connect('http://REMOVE');

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

    var clickCallback = function (e) {

        // if preventDefault exists run it on the original event
        if ( e.preventDefault ) {
            e.preventDefault();
        } else {
            e.returnValue = false;
        }
        var elem = e.target || e.srcElement, href;

        socket.emit("location", { url: elem.href });

//        window.location = elem.href;
    };

    var links = document.getElementsByTagName("a");

    for (var i = 0, n = links.length; i < n; i += 1) {

        if (!links[i].addEventListener) {
            links[i].attachEvent("onclick", clickCallback);
        }
        else {
            links[i].addEventListener("click", clickCallback, false);
        }
    }

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