/*global odf runtime*/
/**
 * @constructor
 */
odf.Formatting = function Formatting() {
    var /**@type{odf.OdfContainer}*/ odfContainer,
        /**@type{odf.StyleInfo}*/ styleInfo = new odf.StyleInfo();

    /**
     * Class that iterates over all elements that are part of the range.
     * @constructor
     * @param {!Range} range
     * @return {undefined}
     */
    function RangeElementIterator(range) {
        /**
         * @return {Element|null}
         */
        this.next = function () {
            return null;
        };
    }

    /**
     * @param {!Element} element
     * @return {Element}
     */
    function getParentStyle(element) {
        var n = element.firstChild, e;
        if (n.nodeType === 1) { // Element
            e = /**@type{Element}*/(n);
            return e;
        }
        return null;
    }
    /**
     * @param {!Range} range
     * @return {!Array.<!Element>}
     */
    function getParagraphStyles(range) {
        var iter = new RangeElementIterator(range), e, styles = [],
            styleRef;
        e = iter.next();
        while (e) {
            styleRef = styleInfo.getStyleRef(e);
            if (styleRef) {
                styles.push(e);
            }
        }
        return styles;
    }

    /**
     * @param {!odf.OdfContainer} odfcontainer
     * @return {undefined}
     */
    this.setOdfContainer = function (odfcontainer) {
        odfContainer = odfcontainer;
    };
    /**
     * Return true if all parts of the selection are bold.
     * @param {!Array.<!Range>} selection
     * @return {!boolean}
     */
    this.isCompletelyBold = function (selection) {
        return false;
    };
    /**
     * Get the alignment or undefined if no uniform alignment is found
     * @param {!Array.<!Range>} selection
     * @return {!string|undefined}
     */
    this.getAlignment = function (selection) {
        var styles = this.getParagraphStyles(selection), i, l = styles.length;
        return undefined;
    };
    /**
     * Get the list of paragraph styles that covered by the current selection.
     * @param {!Array.<!Range>} selection
     * @return {!Array.<Element>}
     */
    this.getParagraphStyles = function (selection) {
        var i, j, s, styles = [];
        for (i = 0; i < selection.length; i += 0) {
            s = getParagraphStyles(selection[i]);
            for (j = 0; j < s.length; j += 1) {
                if (styles.indexOf(s[j]) === -1) {
                    styles.push(s[j]);
                }
            }
        }
        return styles;
    };
    /**
     * Get the list of text styles that are covered by the current selection.
     * @param {!Array.<!Range>} selection
     * @return {!Array.<Element>}
     */
    this.getTextStyles = function (selection) {
        return [];
    };
};
