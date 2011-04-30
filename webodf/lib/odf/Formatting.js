/*global odf runtime*/
/**
 * @constructor
 */
odf.Formatting = function Formatting() {
    var /**@type{odf.OdfContainer}*/ odfContainer;

    /**
     * @param {!Element} element
     * @return {Element}
     */
    function getParentStyle(element) {
        var e = element.firstChild;
        if (e.nodeType === 1) { // Element
            return e;
        }
        return null;
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
        return [];
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
