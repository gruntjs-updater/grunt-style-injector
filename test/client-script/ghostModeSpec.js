ddescribe("Ghost Mode: Scrolling", function () {

    var ghost

    var scope;

    beforeEach(function(){
        document.body.style.cssText = "height:2000px;";
        scope = {
            ghostMode: {
                enabled: true
            }
        };
        ghost = window.ghost.prototype;
        window.scrollTo(0, 0); //reset scroll position after each test.

    });

    it("can Set the scroll position of a window", function () {

        ghost.setScrollTop(scope, 100);
        expect(ghost.getScrollTop()).toBe(100);
    });

    it("can refuse to scroll if locations different", function () {
        ghost.setScrollTop(scope, 100);
        ghost.syncScrollTop("http://www.google.com/shane", 100);
        expect(ghost.getScrollTop()).toBe(100);
    });

    it("can disable ghost mode when setting it's own scroll top. (ie, when it's received an event from server)", function () {
        ghost.setScrollTop(scope.ghostMode, 100);
        expect(scope.ghostMode.enabled).toBe(false);
    });

//    describe("listening for scrolls", function () {
//
//        beforeEach(function(){
//            spyOn(ghost, "emitEvent");
//        });
//
//        it("should listen for scrolls", function () {
//            window.addEventListener("scroll", ghost.emitEvent);
//            window.scrollTo(0, 100);
//            console.log(ghost.getScrollTop());
//            expect(ghost.emitEvent).toHaveBeenCalled();
//        });
//    });
});