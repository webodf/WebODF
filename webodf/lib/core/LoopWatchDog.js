/*global core,runtime */
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
                runtime.log("alert", "watchdog timeout");
                throw "timeout!";
            }
        }
        if (maxChecks > 0) {
            checks += 1;
            if (checks > maxChecks) {
                runtime.log("alert", "watchdog loop overflow");
                throw "loop overflow";
            }
        }
    }
    this.check = check;
};
