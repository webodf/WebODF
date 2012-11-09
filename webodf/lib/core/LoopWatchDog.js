/*global core*/
/**
 * An iterator that iterators through positions in a DOM tree.
 * @constructor
 * @param {!number} timeout
 * @param {!number=} maxChecks
 */
core.LoopWatchDog = function LoopWatchDog(timeout, maxChecks) {
    "use strict";
    var startTime = Date.now(),
        checks = 0;
    function check() {
        var t;
        if (timeout) {
            t = Date.now();
            if (t - startTime > timeout) {
                throw "timeout!";
            }
        }
        if (maxChecks > 0) {
            checks += 1;
            if (checks > maxChecks) {
                throw "loop overflow";
            }
        }
    }
    this.check = check;
};
