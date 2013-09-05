(function () {
    var ghost = {};
    ghost.id = Math.random();
    ghost.eventListener = (window.addEventListener) ? "addEventListener" : "attachEvent";
    ghost.removeEventListener = (window.removeEventListener) ? "removeEventListener" : "detachEvent";
    ghost.prefix = (window.addEventListener) ? "" : "on";
    ghost.cache = {};
    ghost.currentUrl = window.location.href;
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
     * Process options on connection
     */
    socket.on("connection", function (options) {
        processOptions(options);
    });

    /**
     * Reload event (refresh or inject)
     */
    socket.on('reload', function (data) {
        if (data) {
            if (data.url) {
                location.reload();
            } else {
                swapFile(data.assetUrl, getTagName(data.fileExtention));
            }
        }
    });

    /**
     * Update location of all browsers
     */
    socket.on('location:update', function (data) {
        if (data.url) {
            window.location = data.url;
        }
    });

    /**
     * Update window scroll position
     */
    socket.on("scroll:update", function (data) {

        if (data.url === ghost.currentUrl) {
            ghost.disabled = true;
            window.scrollTo(0, data.position);
        }
    });

    /**
     * Update an input field.
     */
    socket.on("input:update", function (data) {
        ghost.disabled = true;
        var elem = checkCache(data.id);
        elem.value = data.value;
    });

    /**
     * Update an input field.
     */
    socket.on("input:update:radio", function (data) {
        ghost.disabled = true;
        var elem = checkCache(data.id);
        elem.checked = true;
    });

    /**
     * Update checkboxes.
     */
    socket.on("input:update:checkbox", function (data) {
        ghost.disabled = true;
        var elem = checkCache(data.id);
        elem.checked = data.checked;
    });

    /**
     * Submit a form.
     */
    socket.on("form:submit", function (data) {
        ghost.disabled = true;
        document.forms[data.id].submit();
    });

    /**
     * Check if we've already had access to this element.
     * @param {string} id
     * @returns {boolean|HTMLElement}
     */
    function checkCache(id) {
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
    }

    /**
     * Helper to retrieve the elem on which an event was triggered
     * @param evt
     * @returns {HTMLHtmlElement}
     */
    function target(evt) {
        return evt.target || evt.srcElement;
    }

    /**
     * Process options retrieved from grunt.
     * @param options
     */
    function processOptions(options) {
        if (options.ghostMode) {
            initGhostMode(options.ghostMode);
        }
        ghost.id = options.id;
    }

    /**
     * Attempt to keep browser scroll Positions in check.
     * @param evt
     */
    function scrollListener(evt) {

        var scrollTop = document.getScroll()[1]; // Get y position of scroll
        var newScroll = new Date().getTime();

        if (!ghost.lastScroll) {
            ghost.scrollTop = scrollTop[0];
            ghost.lastScroll = new Date().getTime();
        }

        if (newScroll > ghost.lastScroll + 50) { // throttle scroll events
            if (!ghost.disabled) {
                ghost.lastScroll = newScroll;
                socket.emit("scroll", { pos: scrollTop, ghostId: ghost.id, url: ghost.currentUrl });
            }
        }

        ghost.disabled = false;
    }

    /**
     * Get scrollTop of window (cross-browser)
     * @returns {Array}
     */
    document.getScroll = function () {
        if (window.pageYOffset != undefined) {
            return [pageXOffset, pageYOffset];
        }
        else {
            var sx, sy, d = document, r = d.documentElement, b = d.body;
            sx = r.scrollLeft || b.scrollLeft || 0;
            sy = r.scrollTop || b.scrollTop || 0;
            return [sx, sy];
        }
    };

    /**
     * Watch for input focus on form element
     */
    function inputFocusCallback(evt) {
        var targetElem = target(evt);
        socket.emit("input:focus", { id: targetElem.id }); // Todo - Is this even needed?
        if (targetElem.type === "text" || targetElem.type === "textarea") {
            targetElem[ghost.eventListener](ghost.prefix + "keyup", keyupCallback, false);
        }
    }

    /**
     * Key-up Call back - inform all browsers
     * @param evt
     */
    function keyupCallback(evt) {
        var elem = target(evt);
        socket.emit("input:type", { id: elem.id, value: elem.value });
    }

    /**
     * Watch for input focus on form element
     */
    function inputBlurCallback(evt) {
        var targetElem = target(evt);
        if (targetElem.type === "text" || targetElem.type === "textarea") {
            targetElem[ghost.removeEventListener]("keyup");
        }
    }


    /**
     * Helper to attach events in a cross-browser manner.
     * @param elems
     * @param event
     * @param callback
     */
    function addEvents(elems, event, callback) {
        for (var i = 0, n = elems.length; i < n; i += 1) {
            elems[i][ghost.eventListener](ghost.prefix + event, callback, false);
        }
    }

    /**
     * Select Box changes
     * @param evt
     */
    function selectChangeCallback(evt) {
        var targetElem = target(evt);
        socket.emit("input:select", { id: targetElem.id, value: targetElem.value });
    }

    /**
     * Radio button change callback
     * @param evt
     */
    function radioChangeCallback(evt) {
        var targetElem = target(evt);
        socket.emit("input:radio", { id: targetElem.id, value: targetElem.value });
    }

    /**
     *
     * @param evt
     */
    function checkboxChangeCallback(evt) {
        var targetElem = target(evt);
        socket.emit("input:checkbox", { id: targetElem.id, checked: targetElem.checked });
    }

    /**
     * force ie7/8 to blur when radio inputs clicked
     * @param evt
     */
    function inputBlurEvent(evt) {
        this.blur();
        this.focus();
    }

    /**
     * Submit a form.
     * @param evt
     */
    function formSubmitCallback(evt) {
        if (!ghost.disabled) {
            var targetElem = target(evt);
            socket.emit("form:submit", { id: targetElem.id });
        }
    }

    /**
     *
     * @returns {{texts: Array, radios: Array, checkboxes: Array}}
     */
    function getInputs() {
        var inputs = document.getElementsByTagName("input");

        var texts = [];
        var radios = [];
        var checkboxes = [];

        for (var i = 0, n = inputs.length; i < n; i += 1) {
            if (inputs[i].type === "text") {
                texts.push(inputs[i]);
            }
            if (inputs[i].type === "radio") {
                radios.push(inputs[i]);
            }
            if (inputs[i].type === "checkbox") {
                checkboxes.push(inputs[i]);
            }
        }

        return {
            texts: texts,
            radios: radios,
            checkboxes: checkboxes
        }
    }


    /**
     * Initi Ghost mode
     */
    function initGhostMode(ghostMode) {

        // Scroll event
        if (ghostMode.scroll) {
            window[ghost.eventListener](ghost.prefix + "scroll", scrollListener, false);
        }

        if (ghostMode.links) {
            // Add click handler to links.
            var links = document.getElementsByTagName("a");
            addEvents(links, "click", clickCallback);
        }

        if (ghostMode.forms) {

            var inputs = getInputs();

            // Radio button events
            addEvents(inputs.radios, "click", inputBlurEvent);
            addEvents(inputs.radios, "change", radioChangeCallback);

            // Text input events
            addEvents(inputs.texts, "focus", inputFocusCallback);
            addEvents(inputs.texts, "blur", inputBlurCallback);

            // Checkbox events
            addEvents(inputs.checkboxes, "click", inputBlurEvent);
            addEvents(inputs.checkboxes, "change", checkboxChangeCallback);

            // Text area Events
            var textAreas = document.getElementsByTagName("textarea");
            addEvents(textAreas, "focus", inputFocusCallback);
            addEvents(textAreas, "blur", inputBlurCallback);

            // Select Box Events
            var selects = document.getElementsByTagName("select");
            addEvents(selects, "change", selectChangeCallback);

            // Submit Event
            var forms = document.getElementsByTagName("form");
            addEvents(forms, "submit", formSubmitCallback);

        }
    }

    /**
     * Walk backwards through the dom to find the clicked links href value in
     * ie7/8
     * @param {HTMLHtmlElement} elem
     * @param {number} parentLimit
     * @returns {*}
     */
    function getParentHref(elem, parentLimit) {

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
    }

    /**
     * Click Call Back
     * @param e
     */
    function clickCallback(e) {

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
    }

    /**
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

}());