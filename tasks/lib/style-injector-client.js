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

var options = {
    tagNames: {
        "css": "link",
        "jpg": "img",
        "png": "img",
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