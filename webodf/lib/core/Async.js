/*global runtime core*/

/**
 * @constructor
 */
core.Async = function Async() {
    /**
     * @param {!Array.<*>} items
     * @param {function(*, !function(!string):undefined):undefined} f
     * @param {function(?string)} callback
     * @return {undefined}
     */
    this.forEach = function (items, f, callback) {
        var i, l = items.length, itemsDone = 0;
        function end(err) {
            if (itemsDone !== l) {
                if (err) {
                    itemsDone = l;
                    callback(err);
                } else {
                    itemsDone += 1;
                    if (itemsDone === l) {
                        callback(null);
                    }
                }
            }
        }
        for (i = 0; i < l; i += 1) {
            f(items[i], end);
        }
    };
};
