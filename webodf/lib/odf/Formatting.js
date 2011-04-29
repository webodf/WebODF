/*global odf runtime*/
/**
 * @constructor
 * @param {!odf.OdfContainer} odfContainer 
 */
odf.Formatting = function Formatting(odfContainer) {

    /**
     * Return the current selection as an array of ranges.
     * @return {!Array.<Range>}
     */
    function getSelection() {
        return [];
    }

    /**
     * Return true if all parts of the selection are bold.
     * @return {!boolean}
     */
    this.isBold = function () {
        return false;
    };
    /**
     * Get the list of paragraph styles that covered by the current selection.
     * @return {!Array.<Element>}
     */
    this.getParagraphStyles = function () {
        return [];
    };
    /**
     * Get the list of text styles that are covered by the current selection.
     * @return {!Array.<Element>}
     */
    this.getTextStyles = function () {
        return [];
    };
};
