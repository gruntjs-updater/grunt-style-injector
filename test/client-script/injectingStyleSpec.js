/**
 * Created by shakyshane on 18/09/2013.
 */

describe("Injecting Styles:", function () {

    var si;
    var scope;
    var methods;
    var siActions;
    var actions;

    var wrapUrl = function (url) {
        return "http://" + window.location.host + "/" + url;
    };

    beforeEach(function(){
        si = window.styleInjector;
        methods = si.prototype;
        siActions = window.styleInjectorActions;
        actions = siActions.prototype;
        scope = {};
    });

    describe("Reloading CSS files:", function () {

        var options;
        beforeEach(function(){
            spyOn(actions, "reloadBrowser");
            spyOn(actions, "swapFile");
        });

        it("can reload the browser if a url is provided", function () {

            methods.reloadEvent(scope, { url: "truthyString" }, actions);
            expect(actions.reloadBrowser).toHaveBeenCalled();
        });

//        it("Can call the swap file method if an assetURL is provided", function () {
//
//            methods.reloadEvent(scope, { assetFileName: "style.css", fileExtention: "css" }, actions);
//            expect(actions.swapFile).toHaveBeenCalledWith("style.css", "link");
//        });
    });
    describe("Getting Tag names", function () {

        it("can get a CSS tagname", function () {

            expect(methods.getTagName("css")).toBe("link");
        });
        it("can get a IMG tagname", function () {

            expect(methods.getTagName("jpg")).toBe("img");
        });
    });

    describe("getting matching dom elements", function () {
        var elem, elem2, elem3, elems, match;


        beforeEach(function() {

            elem = document.createElement("link");
            elem.href = "style.css";
            elem2 = document.createElement("link");
            elem2.href = "core.css";
            elem3 = document.createElement("link");
            elem3.href = "style-with-rel.css?rel=213456";

            elems = document.getElementsByTagName("link");
            match = null;
        });

        it("can return matched elements", function () {
            match = methods.getMatches([elem, elem2], "style.css", "href");
            expect(match.href).toBe(wrapUrl("style.css"));
        });

        it("can return matched elems with existing query strings", function () {
            match = methods.getMatches([elem, elem2, elem3], "style-with-rel.css", "href");
            expect(match.href).toBe(wrapUrl("style-with-rel.css?rel=213456"));
        });
    });

    describe("Swapping a file", function () {

        var elem, elem2, elem3, elem4;
        var regex = /(style\.css\?rel=\d+)$/;

        beforeEach(function(){
            elem = document.createElement("link");
            elem.href = "/core/style.css";
            elem2 = document.createElement("link");
            elem2.href = "/core/style.css?rel=23456";
            elem3 = document.createElement("link");
            elem3.href = "style.css?rel=";
            elem4 = document.createElement("link");
            elem4.href = "/core/style.css??";
        });

            describe("when using a regex in tests", function () {
                it("can run a true test", function () {
                    expect(regex.test("style.css?rel=2335")).toBe(true);
                });
                it("can run a false test", function () {
                    expect(regex.test("style.css")).toBe(false);
                    expect(regex.test("style.css?")).toBe(false);
                });
            });

        it("can append a rel timestamp to a link that doesn't have one", function () {

            var transformedElem = actions.swapFile(elem, "href");
            expect(regex.test(transformedElem.href)).toBeTruthy();
        });

        it("can append a rel timestamp to a link that already has one", function () {

            var transformedElem = actions.swapFile(elem2, "href");
            expect(regex.test(transformedElem.href)).toBeTruthy();
        });

        it("can append a rel timestamp to a mal-formed assetUrl", function () {

            var transformedElem = actions.swapFile(elem3, "href");
            expect(regex.test(transformedElem.href)).toBeTruthy();
        });

        it("can append a rel timestamp to a mal-formed assetUrl (2)", function () {

            var transformedElem = actions.swapFile(elem4, "href");
            expect(regex.test(transformedElem.href)).toBeTruthy();
        });
    });
});